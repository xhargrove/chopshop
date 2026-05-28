"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { applyBleepRegions } from "@/lib/bleepEdit";
import { generateRekordboxXml } from "@/lib/export/rekordboxXml";
import { generateSeratoCueExport } from "@/lib/export/seratoExport";
import { ANALYSIS_PROGRESS_COMPLETE, EXPORT_DOWNLOAD_STAGGER_MS, EXPORT_OBJECT_URL_REVOKE_MS } from "@/lib/constants";
import type { AudioSession } from "@/types/audio";
import type { ExportInMessage, ExportOptions, ExportOutMessage } from "@/types/audioExport";
import type { StemType } from "@/types/stems";

interface UseExportReturn {
  isExporting: boolean;
  progress: number;
  exportFiles: (session: AudioSession, options: ExportOptions) => Promise<void>;
  cancel: () => void;
}

interface EncodedFile {
  blob: Blob;
  filename: string;
}

type PendingExport = {
  resolve: (file: EncodedFile) => void;
  reject: (error: Error) => void;
  filename: string;
};

const sanitizeTrackName = (fileName: string): string =>
  fileName
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const getRegionBounds = (session: AudioSession, region: ExportOptions["region"]): { start: number; end: number; label: string } => {
  if (typeof region === "object") {
    return { start: region.start, end: region.end, label: "selection" };
  }

  if (region === "intro" || region === "outro") {
    const matchingRegion = session.regions.find((candidate) => candidate.type === region);
    return matchingRegion ? { start: matchingRegion.start, end: matchingRegion.end, label: region } : { start: 0, end: session.file.durationSeconds, label: "full" };
  }

  return { start: 0, end: session.file.durationSeconds, label: "full" };
};

const copyChannel = (audioBuffer: AudioBuffer, channelIndex: number, startFrame: number, frameCount: number): Float32Array => {
  const data = new Float32Array(frameCount);
  audioBuffer.copyFromChannel(data, Math.min(channelIndex, audioBuffer.numberOfChannels - 1), startFrame);
  return data;
};

const audioBufferToStereo = (audioBuffer: AudioBuffer, startSeconds = 0, endSeconds = audioBuffer.duration): Float32Array => {
  const startFrame = Math.max(0, Math.floor(startSeconds * audioBuffer.sampleRate));
  const endFrame = Math.min(audioBuffer.length, Math.ceil(endSeconds * audioBuffer.sampleRate));
  const frameCount = Math.max(endFrame - startFrame, 0);
  const left = copyChannel(audioBuffer, 0, startFrame, frameCount);
  const right = copyChannel(audioBuffer, audioBuffer.numberOfChannels > 1 ? 1 : 0, startFrame, frameCount);
  const interleaved = new Float32Array(frameCount * 2);

  for (let frame = 0; frame < frameCount; frame += 1) {
    interleaved[frame * 2] = left[frame];
    interleaved[frame * 2 + 1] = right[frame];
  }

  return interleaved;
};

const downloadFiles = (files: readonly EncodedFile[]): void => {
  files.forEach((file, index) => {
    window.setTimeout(() => {
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.filename;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), EXPORT_OBJECT_URL_REVOKE_MS);
    }, index * EXPORT_DOWNLOAD_STAGGER_MS);
  });
};

export function useExport(): UseExportReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<PendingExport | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const createWorker = useCallback((): Worker => {
    const worker = new Worker(new URL("../workers/audioExport.worker.ts", import.meta.url));

    worker.onmessage = (event: MessageEvent<ExportOutMessage>): void => {
      const response = event.data;

      if (response.type === "PROGRESS") {
        setProgress(response.percent);
        return;
      }

      const pending = pendingRef.current;
      pendingRef.current = null;

      if (!pending) {
        return;
      }

      if (response.type === "COMPLETE") {
        pending.resolve({ blob: response.blob, filename: pending.filename });
        return;
      }

      pending.reject(new Error(response.message));
    };

    worker.onerror = (event: ErrorEvent): void => {
      pendingRef.current?.reject(new Error(event.message));
      pendingRef.current = null;
    };

    return worker;
  }, []);

  useEffect(() => {
    workerRef.current = createWorker();

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [createWorker]);

  const sendExportMessage = useCallback((message: ExportInMessage, filename: string): Promise<EncodedFile> => {
    const worker = workerRef.current;

    if (!worker) {
      return Promise.reject(new Error("Export worker is not available."));
    }

    return new Promise<EncodedFile>((resolve, reject) => {
      pendingRef.current = { resolve, reject, filename };

      if (message.type === "EXPORT_STEM_ZIP") {
        worker.postMessage(message, Object.values(message.stems).map((stem) => stem.buffer));
        return;
      }

      worker.postMessage(message, [message.buffer.buffer]);
    });
  }, []);

  const exportFiles = useCallback(
    async (session: AudioSession, options: ExportOptions): Promise<void> => {
      setIsExporting(true);
      setProgress(0);

      try {
        const audioContext = new AudioContext();
        const sourceBuffer = await audioContext.decodeAudioData(await session.file.sourceFile.arrayBuffer());
        const region = getRegionBounds(session, options.region);
        const baseName = sanitizeTrackName(session.file.name);
        const files: EncodedFile[] = [];
        let stereoBuffer = audioBufferToStereo(sourceBuffer, region.start, region.end);

        if (session.bleepRegions.length > 0) {
          const adjustedRegions = session.bleepRegions.map((bleepRegion) => ({
            ...bleepRegion,
            start: Math.max(bleepRegion.start - region.start, 0),
            end: Math.min(bleepRegion.end - region.start, region.end - region.start),
          }));
          stereoBuffer = applyBleepRegions(stereoBuffer, adjustedRegions, sourceBuffer.sampleRate);
        }

        if (options.format === "wav" || options.format === "both") {
          files.push(await sendExportMessage({ type: "EXPORT_WAV", buffer: stereoBuffer.slice(), sampleRate: sourceBuffer.sampleRate, numChannels: 2 }, `${baseName}_${region.label}.wav`));
        }

        if (options.format === "mp3" || options.format === "both") {
          files.push(
            await sendExportMessage(
              { type: "EXPORT_MP3", buffer: stereoBuffer.slice(), sampleRate: sourceBuffer.sampleRate, numChannels: 2, bitrate: options.mp3Bitrate },
              `${baseName}_${region.label}.mp3`,
            ),
          );
        }

        if (options.exportRekordbox) {
          files.push({
            blob: new Blob([generateRekordboxXml(session)], { type: "application/xml" }),
            filename: `${baseName}_rekordbox.xml`,
          });
        }

        if (options.exportSerato) {
          files.push({
            blob: new Blob([JSON.stringify(generateSeratoCueExport(session), null, 2)], { type: "application/json" }),
            filename: `${baseName}_serato_cues.json`,
          });
        }

        if (options.includeStems && options.stems) {
          const stems = Object.entries(options.stems).reduce<Record<string, Float32Array>>((accumulator, [stem, stemBuffer]) => {
            if (stemBuffer) {
              accumulator[`${baseName}_${stem}`] = audioBufferToStereo(stemBuffer);
            }

            return accumulator;
          }, {});

          if (Object.keys(stems).length > 0) {
            files.push(
              await sendExportMessage({ type: "EXPORT_STEM_ZIP", stems, sampleRate: sourceBuffer.sampleRate, format: options.includeStems }, `${baseName}_stems.zip`),
            );
          }
        }

        await audioContext.close();
        downloadFiles(files);
        setProgress(ANALYSIS_PROGRESS_COMPLETE);
      } finally {
        setIsExporting(false);
      }
    },
    [sendExportMessage],
  );

  const cancel = useCallback((): void => {
    workerRef.current?.terminate();
    workerRef.current = createWorker();
    pendingRef.current?.reject(new Error("Export cancelled."));
    pendingRef.current = null;
    setIsExporting(false);
    setProgress(0);
  }, [createWorker]);

  return {
    isExporting,
    progress,
    exportFiles,
    cancel,
  };
}
