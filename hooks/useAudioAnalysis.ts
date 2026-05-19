"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ANALYSIS_PROGRESS_COMPLETE, ANALYSIS_PROGRESS_START } from "@/lib/constants";
import { useAudioStore } from "@/store/audioStore";
import type { AnalysisState, WorkerInMessage, WorkerOutMessage } from "@/types/audioAnalysis";

export interface UseAudioAnalysisReturn extends AnalysisState {
  analyze: (audioBuffer: ArrayBuffer, sampleRate: number) => void;
  cancel: () => void;
  reset: () => void;
}

const initialState: AnalysisState = {
  isAnalyzing: false,
  stage: "idle",
  progress: ANALYSIS_PROGRESS_START,
  bpmResult: null,
  bpmConfidence: null,
  keyResult: null,
  keyConfidence: null,
  error: null,
};

export function useAudioAnalysis(): UseAudioAnalysisReturn {
  const workerRef = useRef<Worker | null>(null);
  const setBpm = useAudioStore((state) => state.setBpm);
  const setKey = useAudioStore((state) => state.setKey);
  const [state, setState] = useState<AnalysisState>(initialState);

  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL("../workers/audioAnalysis.worker.ts", import.meta.url));
    } catch (error) {
      setState({
        ...initialState,
        stage: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    const worker = workerRef.current;

    const handleMessage = (event: MessageEvent<WorkerOutMessage>): void => {
      const response = event.data;

      if (response.type === "PROGRESS") {
        setState((current) => ({
          ...current,
          isAnalyzing: true,
          stage: response.stage,
          progress: response.percent,
        }));
        return;
      }

      if (response.type === "BPM_RESULT") {
        setBpm(response.bpm, "auto");
        setState((current) => ({
          ...current,
          bpmResult: response.bpm,
          bpmConfidence: response.confidence,
        }));
        return;
      }

      if (response.type === "KEY_RESULT") {
        setKey(response.key, "auto");
        setState((current) => ({
          ...current,
          isAnalyzing: false,
          stage: "done",
          progress: ANALYSIS_PROGRESS_COMPLETE,
          keyResult: response.key,
          keyConfidence: response.confidence,
        }));
        return;
      }

      if (response.type === "ERROR") {
        setState((current) => ({
          ...current,
          isAnalyzing: false,
          stage: "error",
          error: response.message,
        }));
        return;
      }

      setState(initialState);
    };

    const handleError = (event: ErrorEvent): void => {
      setState({
        ...initialState,
        stage: "error",
        error: event.message,
      });
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);

    return () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      worker.terminate();
      workerRef.current = null;
    };
  }, [setBpm, setKey]);

  const analyze = useCallback((audioBuffer: ArrayBuffer, sampleRate: number): void => {
    const worker = workerRef.current;

    if (!worker) {
      setState({
        ...initialState,
        stage: "error",
        error: "Audio analysis worker is not available.",
      });
      return;
    }

    const message: WorkerInMessage = {
      type: "ANALYZE_ALL",
      audioBuffer,
      sampleRate,
    };

    setState({
      ...initialState,
      isAnalyzing: true,
      stage: "bpm",
    });
    worker.postMessage(message, [audioBuffer]);
  }, []);

  const cancel = useCallback((): void => {
    const message: WorkerInMessage = { type: "CANCEL" };
    workerRef.current?.postMessage(message);
    setState(initialState);
  }, []);

  const reset = useCallback((): void => {
    setState(initialState);
  }, []);

  return {
    ...state,
    analyze,
    cancel,
    reset,
  };
}
