"use client";

import { useEffect, useRef } from "react";

import { createSessionSnapshot, saveSessionSnapshot } from "@/lib/sessionPersistence";
import { useAudioStore } from "@/store/audioStore";

const AUTOSAVE_DEBOUNCE_MS = 800;

export function useSessionAutosave(): void {
  const session = useAudioStore((state) => state.session);
  const editorSettings = useAudioStore((state) => state.editorSettings);
  const markAutosaved = useAudioStore((state) => state.markAutosaved);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const file = session.file.sourceFile;
      const snapshot = createSessionSnapshot(session, editorSettings, file);
      saveSessionSnapshot(snapshot);
      markAutosaved(snapshot.savedAt);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [editorSettings, markAutosaved, session]);
}
