"use client";

import { useCallback, useRef, useState } from "react";

import { ANALYSIS_PROGRESS_COMPLETE, ANALYSIS_PROGRESS_START } from "@/lib/constants";
import type { SeparationEvent, StemModel, StemSeparationState, StemType } from "@/types/stems";

interface UseStemSeparationReturn extends StemSeparationState {
  separate: (file: File, model: "2stems" | "4stems", region?: { start: number; end: number }) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const initialState: StemSeparationState = {
  status: "idle",
  progress: ANALYSIS_PROGRESS_START,
  stage: "",
  stems: {},
  error: null,
};

const parseJsonLines = (chunk: string, pending: string): { events: SeparationEvent[]; pending: string } => {
  const lines = `${pending}${chunk}`.split("\n");
  const nextPending = lines.pop() ?? "";
  const events = lines.reduce<SeparationEvent[]>((accumulator, line) => {
    if (line.trim()) {
      accumulator.push(JSON.parse(line) as SeparationEvent);
    }

    return accumulator;
  }, []);

  return { events, pending: nextPending };
};

export function useStemSeparation(onComplete?: (stems: Partial<Record<StemType, AudioBuffer>>) => void): UseStemSeparationReturn {
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [state, setState] = useState<StemSeparationState>(initialState);

  const reset = useCallback((): void => {
    setState(initialState);
  }, []);

  const cancel = useCallback((): void => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setState(initialState);
  }, []);

  const decodeStem = useCallback(async (stem: StemType, url: string, signal: AbortSignal): Promise<[StemType, AudioBuffer] | null> => {
    const response = await fetch(url, { signal });
    const arrayBuffer = await response.arrayBuffer();

    if (signal.aborted) {
      return null;
    }

    const audioContext = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = audioContext;
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    if (!signal.aborted) {
      setState((current) => ({
        ...current,
        stems: {
          ...current.stems,
          [stem]: audioBuffer,
        },
      }));
      return [stem, audioBuffer];
    }

    return null;
  }, []);

  const separate = useCallback(
    async (file: File, model: StemModel, region?: { start: number; end: number }): Promise<void> => {
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const formData = new FormData();
      formData.set("file", file);
      formData.set("model", model);

      if (region) {
        formData.set("region_start", String(region.start));
        formData.set("region_end", String(region.end));
      }

      setState({ ...initialState, status: "uploading", stage: "Uploading audio" });

      try {
        const response = await fetch("/api/separate", {
          method: "POST",
          body: formData,
          signal: abortController.signal,
        });

        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error("Stem separation response was empty.");
        }

        const decoder = new TextDecoder();
        let pending = "";
        const decodeTasks: Promise<[StemType, AudioBuffer] | null>[] = [];

        setState((current) => ({ ...current, status: "processing" }));

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          const parsed = parseJsonLines(decoder.decode(value, { stream: true }), pending);
          pending = parsed.pending;

          parsed.events.forEach((event) => {
            if (event.type === "PROGRESS") {
              setState((current) => ({ ...current, progress: event.percent, stage: event.stage, status: "processing" }));
            }

            if (event.type === "STEM_READY") {
              decodeTasks.push(decodeStem(event.stem, event.url, abortController.signal));
            }

            if (event.type === "ERROR") {
              setState((current) => ({ ...current, status: "error", error: event.message, stage: "Separation failed" }));
            }
          });
        }

        const decodedStems = (await Promise.all(decodeTasks)).reduce<Partial<Record<StemType, AudioBuffer>>>((accumulator, result) => {
          if (result) {
            const [stem, audioBuffer] = result;
            accumulator[stem] = audioBuffer;
          }

          return accumulator;
        }, {});

        onComplete?.(decodedStems);
        setState((current) => ({ ...current, stems: decodedStems, status: "complete", progress: ANALYSIS_PROGRESS_COMPLETE, stage: "Stems ready" }));
      } catch (error) {
        if (!abortController.signal.aborted) {
          setState({ ...initialState, status: "error", stage: "Separation failed", error: error instanceof Error ? error.message : String(error) });
        }
      }
    },
    [decodeStem, onComplete],
  );

  return {
    ...state,
    separate,
    cancel,
    reset,
  };
}
