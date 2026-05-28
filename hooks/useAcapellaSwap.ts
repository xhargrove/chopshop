"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_SWAP_INSTRUMENTAL_GAIN, DEFAULT_SWAP_VOCAL_GAIN } from "@/lib/constants";
import { detectOffset, mixBuffers } from "@/lib/audioMix";
import type { WorkerInMessage, WorkerOutMessage } from "@/types/audioAnalysis";
import type { StemType } from "@/types/stems";

interface UseAcapellaSwapOptions {
  trackBuffer: AudioBuffer | null;
  stems: Partial<Record<StemType, AudioBuffer>>;
  onCommit: (payload: { vocalsGain: number; instrumentalGain: number; offsetSeconds: number }) => void;
}

interface UseAcapellaSwapReturn {
  isAligning: boolean;
  isPreviewing: boolean;
  offsetSeconds: number;
  vocalsGain: number;
  instrumentalGain: number;
  setVocalsGain: (gain: number) => void;
  setInstrumentalGain: (gain: number) => void;
  alignOffset: () => Promise<void>;
  preview: () => Promise<void>;
  stopPreview: () => void;
  commit: () => void;
}

const getInstrumentalBuffer = (stems: Partial<Record<StemType, AudioBuffer>>): AudioBuffer | null => {
  const drums = stems.drums;
  const bass = stems.bass;
  const other = stems.other;

  if (!drums && !bass && !other) {
    return null;
  }

  const reference = drums ?? bass ?? other;

  if (!reference) {
    return null;
  }

  const context = new OfflineAudioContext(2, reference.length, reference.sampleRate);
  const output = context.createBuffer(2, reference.length, reference.sampleRate);

  [drums, bass, other].forEach((stem) => {
    if (!stem) {
      return;
    }

    for (let channel = 0; channel < output.numberOfChannels; channel += 1) {
      const outputData = output.getChannelData(channel);
      const stemData = stem.getChannelData(Math.min(channel, stem.numberOfChannels - 1));

      for (let index = 0; index < Math.min(outputData.length, stemData.length); index += 1) {
        outputData[index] += stemData[index];
      }
    }
  });

  return output;
};

export function useAcapellaSwap({ trackBuffer, stems, onCommit }: UseAcapellaSwapOptions): UseAcapellaSwapReturn {
  const workerRef = useRef<Worker | null>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewContextRef = useRef<AudioContext | null>(null);
  const [isAligning, setIsAligning] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [offsetSeconds, setOffsetSeconds] = useState(0);
  const [vocalsGain, setVocalsGain] = useState(DEFAULT_SWAP_VOCAL_GAIN);
  const [instrumentalGain, setInstrumentalGain] = useState(DEFAULT_SWAP_INSTRUMENTAL_GAIN);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/audioAnalysis.worker.ts", import.meta.url));
    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const stopPreview = useCallback((): void => {
    previewSourceRef.current?.stop();
    previewSourceRef.current = null;
    void previewContextRef.current?.close();
    previewContextRef.current = null;
    setIsPreviewing(false);
  }, []);

  const alignOffset = useCallback(async (): Promise<void> => {
    const vocals = stems.vocals;
    const instrumental = getInstrumentalBuffer(stems);

    if (!trackBuffer || !vocals || !instrumental) {
      return;
    }

    setIsAligning(true);

    const worker = workerRef.current;

    if (!worker) {
      setOffsetSeconds(detectOffset(trackBuffer, vocals));
      setIsAligning(false);
      return;
    }

    const sampleRate = trackBuffer.sampleRate;
    const length = Math.min(trackBuffer.length, vocals.length, sampleRate * 30);
    const bufferA = new Float32Array(length);
    const bufferB = new Float32Array(length);

    for (let index = 0; index < length; index += 1) {
      bufferA[index] = trackBuffer.getChannelData(0)[index] ?? 0;
      bufferB[index] = vocals.getChannelData(0)[index] ?? 0;
    }

    const offset = await new Promise<number>((resolve, reject) => {
      const handleMessage = (event: MessageEvent<WorkerOutMessage>): void => {
        if (event.data.type === "OFFSET_RESULT") {
          worker.removeEventListener("message", handleMessage);
          resolve(event.data.offsetSeconds);
        }

        if (event.data.type === "ERROR") {
          worker.removeEventListener("message", handleMessage);
          reject(new Error(event.data.message));
        }
      };

      worker.addEventListener("message", handleMessage);
      const message: WorkerInMessage = { type: "DETECT_OFFSET", bufferA, bufferB, sampleRate };
      worker.postMessage(message);
    }).catch(() => detectOffset(trackBuffer, vocals));

    setOffsetSeconds(offset);
    setIsAligning(false);
  }, [stems, trackBuffer]);

  const preview = useCallback(async (): Promise<void> => {
    const vocals = stems.vocals;
    const instrumental = getInstrumentalBuffer(stems);

    if (!trackBuffer || !vocals || !instrumental) {
      return;
    }

    stopPreview();
    const context = new AudioContext();
    const mixed = mixBuffers(context, vocals, instrumental, vocalsGain, instrumentalGain, offsetSeconds);
    const source = context.createBufferSource();
    source.buffer = mixed;
    source.connect(context.destination);
    source.start();
    previewContextRef.current = context;
    previewSourceRef.current = source;
    setIsPreviewing(true);
    source.onended = () => stopPreview();
  }, [instrumentalGain, offsetSeconds, stems, stopPreview, trackBuffer, vocalsGain]);

  const commit = useCallback((): void => {
    onCommit({ vocalsGain, instrumentalGain, offsetSeconds });
    stopPreview();
  }, [instrumentalGain, offsetSeconds, onCommit, stopPreview, vocalsGain]);

  return {
    isAligning,
    isPreviewing,
    offsetSeconds,
    vocalsGain,
    instrumentalGain,
    setVocalsGain,
    setInstrumentalGain,
    alignOffset,
    preview,
    stopPreview,
    commit,
  };
}
