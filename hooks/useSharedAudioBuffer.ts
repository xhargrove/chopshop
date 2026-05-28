"use client";

import { useEffect, useState } from "react";

import { audioBufferCache, type DecodedAudioEntry } from "@/lib/audioBufferCache";

interface SharedAudioBufferState {
  entry: DecodedAudioEntry | null;
  isDecoding: boolean;
  error: string | null;
}

const initialState: SharedAudioBufferState = {
  entry: null,
  isDecoding: false,
  error: null,
};

export function useSharedAudioBuffer(file: File | null, fileId: string | null): SharedAudioBufferState {
  const [state, setState] = useState<SharedAudioBufferState>(initialState);

  useEffect(() => {
    if (!file) {
      setState(initialState);
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, isDecoding: true, error: null }));

    void audioBufferCache.getOrDecode(file).then(
      (entry) => {
        if (!cancelled) {
          setState({ entry, isDecoding: false, error: null });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({
            entry: null,
            isDecoding: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [file, fileId]);

  return state;
}
