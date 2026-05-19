"use client";

import { useEffect, useRef } from "react";

import { useAudioAnalysis, type UseAudioAnalysisReturn } from "@/hooks/useAudioAnalysis";
import type { AudioSession } from "@/types/audio";

export function useSessionAudioAnalysis(session: AudioSession): UseAudioAnalysisReturn {
  const analyzedFileIdRef = useRef<string | null>(null);
  const analysis = useAudioAnalysis();
  const { analyze, cancel, reset } = analysis;

  useEffect(() => {
    if (analyzedFileIdRef.current === session.file.id || (session.autoBpm !== null && session.autoKey !== null)) {
      return;
    }

    let isCancelled = false;
    analyzedFileIdRef.current = session.file.id;

    const loadForAnalysis = async (): Promise<void> => {
      try {
        const response = await fetch(session.file.url);
        const audioBuffer = await response.arrayBuffer();

        if (!isCancelled) {
          analyze(audioBuffer, 0);
        }
      } catch {
        reset();
      }
    };

    void loadForAnalysis();

    return () => {
      isCancelled = true;
      cancel();
    };
  }, [analyze, cancel, reset, session.autoBpm, session.autoKey, session.file.id, session.file.url]);

  return analysis;
}
