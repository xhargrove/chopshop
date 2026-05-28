"use client";

import { useCallback, useMemo } from "react";

import { useKeyboardShortcuts, type ShortcutHandlers } from "@/hooks/useKeyboardShortcuts";
import { EDITOR_NUDGE_LARGE_SECONDS, EDITOR_NUDGE_SMALL_SECONDS } from "@/lib/constants";
import { useUndoStore } from "@/store/undoStore";
import type { AudioSession } from "@/types/audio";

interface UseSessionShortcutsOptions {
  session: AudioSession;
  currentTime: number;
  totalDuration: number;
  isLoaded: boolean;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setIntroIn: () => void;
  setIntroOut: () => void;
  setOutroIn: () => void;
  setOutroOut: () => void;
  toggleLoop: () => void;
  setLoopIn: () => void;
  setLoopOut: () => void;
  setCueAtHotkey: (hotkey: number, position: number) => void;
  scrollToTime: (seconds: number) => void;
  setActiveCue: (id: string | null) => void;
  setActiveRegion: (id: string | null) => void;
}

export function useSessionShortcuts({
  session,
  currentTime,
  totalDuration,
  isLoaded,
  isPlaying,
  play,
  pause,
  seek,
  setIntroIn,
  setIntroOut,
  setOutroIn,
  setOutroOut,
  toggleLoop,
  setLoopIn,
  setLoopOut,
  setCueAtHotkey,
  scrollToTime,
  setActiveCue,
  setActiveRegion,
}: UseSessionShortcutsOptions): void {
  const undo = useUndoStore((state) => state.undo);
  const redo = useUndoStore((state) => state.redo);

  const jumpToCue = useCallback(
    (hotkey: number): void => {
      const cuePoint = session.cuePoints.find((cue) => cue.hotkey === hotkey);

      if (cuePoint) {
        setActiveCue(cuePoint.id);
        seek(cuePoint.position);
        scrollToTime(Math.max(cuePoint.position - 1, 0));
      }
    },
    [scrollToTime, seek, session.cuePoints, setActiveCue],
  );

  const setCueAtPlayhead = useCallback(
    (hotkey: number): void => {
      setCueAtHotkey(hotkey, currentTime);
    },
    [currentTime, setCueAtHotkey],
  );

  const handlers = useMemo<ShortcutHandlers>(
    () => ({
      togglePlayback: () => (isPlaying ? pause() : play()),
      setIntroIn,
      setIntroOut,
      setOutroIn,
      setOutroOut,
      toggleLoop,
      setLoopIn,
      setLoopOut,
      nudgeBackwardSmall: () => seek(Math.max(currentTime - EDITOR_NUDGE_SMALL_SECONDS, 0)),
      nudgeForwardSmall: () => seek(Math.min(currentTime + EDITOR_NUDGE_SMALL_SECONDS, totalDuration)),
      nudgeBackwardLarge: () => seek(Math.max(currentTime - EDITOR_NUDGE_LARGE_SECONDS, 0)),
      nudgeForwardLarge: () => seek(Math.min(currentTime + EDITOR_NUDGE_LARGE_SECONDS, totalDuration)),
      clearSelection: () => {
        setActiveCue(null);
        setActiveRegion(null);
      },
      jumpToCue1: () => jumpToCue(1),
      jumpToCue2: () => jumpToCue(2),
      jumpToCue3: () => jumpToCue(3),
      jumpToCue4: () => jumpToCue(4),
      jumpToCue5: () => jumpToCue(5),
      jumpToCue6: () => jumpToCue(6),
      jumpToCue7: () => jumpToCue(7),
      jumpToCue8: () => jumpToCue(8),
      setCue1: () => setCueAtPlayhead(1),
      setCue2: () => setCueAtPlayhead(2),
      setCue3: () => setCueAtPlayhead(3),
      setCue4: () => setCueAtPlayhead(4),
      setCue5: () => setCueAtPlayhead(5),
      setCue6: () => setCueAtPlayhead(6),
      setCue7: () => setCueAtPlayhead(7),
      setCue8: () => setCueAtPlayhead(8),
      undo,
      redo,
    }),
    [
      currentTime,
      isPlaying,
      jumpToCue,
      pause,
      play,
      redo,
      seek,
      setActiveCue,
      setActiveRegion,
      setCueAtPlayhead,
      setIntroIn,
      setIntroOut,
      setLoopIn,
      setLoopOut,
      setOutroIn,
      setOutroOut,
      toggleLoop,
      totalDuration,
      undo,
    ],
  );

  useKeyboardShortcuts(handlers, isLoaded);
}
