"use client";

import { useEffect, useRef } from "react";

import { useAudioAnalysis, type UseAudioAnalysisReturn } from "@/hooks/useAudioAnalysis";
import { audioBufferCache } from "@/lib/audioBufferCache";
import type { AudioSession } from "@/types/audio";

export function useSessionAudioAnalysis(session: AudioSession): UseAudioAnalysisReturn {
  const analyzedFileIdRef = useRef<string | null>(null);
  const analysis = useAudioAnalysis();
  const { analyze, cancel, reset } = analysis;

  useEffect(() => {
    if (analyzedFileIdRef.current === session.file.id) {
      return;
    }

    let isCancelled = false;
    analyzedFileIdRef.current = session.file.id;

    const loadForAnalysis = async (): Promise<void> => {
      try {
        const { analysisBytes, buffer } = await audioBufferCache.getOrDecode(session.file.sourceFile);

        if (!isCancelled) {
          analyze(analysisBytes, buffer.sampleRate);
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
  }, [analyze, cancel, reset, session.file.id, session.file.sourceFile]);

  return analysis;
}
