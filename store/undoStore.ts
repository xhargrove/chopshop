"use client";

import { create } from "zustand";

import { UNDO_STACK_LIMIT } from "@/lib/constants";
import type { AudioSession } from "@/types/audio";

export interface UndoHistoryEntry {
  label: string;
  timestamp: number;
}

interface UndoAccessors {
  getSession: () => AudioSession | null;
  applySession: (session: AudioSession) => void;
}

export interface UndoStore {
  past: AudioSession[];
  future: AudioSession[];
  history: UndoHistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;
  pushState: (session: AudioSession, label?: string) => void;
  undo: () => void;
  redo: () => void;
  undoTo: (historyIndex: number) => void;
  clear: () => void;
}

let accessors: UndoAccessors | null = null;

export const registerUndoSessionAccessors = (nextAccessors: UndoAccessors): void => {
  accessors = nextAccessors;
};

export const cloneAudioSession = (session: AudioSession): AudioSession => ({
  ...session,
  file: { ...session.file },
  regions: session.regions.map((region) => ({ ...region })),
  cuePoints: session.cuePoints.map((cuePoint) => ({ ...cuePoint })),
  bleepRegions: session.bleepRegions.map((region) => ({ ...region })),
  transitionCues: session.transitionCues.map((cue) => ({ ...cue })),
  acapellaSwap: session.acapellaSwap ? { ...session.acapellaSwap } : null,
});

const getStackState = (past: readonly AudioSession[], future: readonly AudioSession[]): Pick<UndoStore, "canUndo" | "canRedo"> => ({
  canUndo: past.length > 0,
  canRedo: future.length > 0,
});

export const useUndoStore = create<UndoStore>()((set, get) => ({
  past: [],
  future: [],
  history: [],
  canUndo: false,
  canRedo: false,
  pushState: (session: AudioSession, label: string = "Edit session"): void => {
    set((state) => {
      const nextPast = [...state.past, cloneAudioSession(session)].slice(-UNDO_STACK_LIMIT);
      const nextHistory = [...state.history, { label, timestamp: Date.now() }].slice(-UNDO_STACK_LIMIT);
      return {
        past: nextPast,
        future: [],
        history: nextHistory,
        ...getStackState(nextPast, []),
      };
    });
  },
  undo: (): void => {
    const currentSession = accessors?.getSession();
    const previousSession = get().past[get().past.length - 1];

    if (!currentSession || !previousSession || !accessors) {
      return;
    }

    const nextPast = get().past.slice(0, -1);
    const nextFuture = [cloneAudioSession(currentSession), ...get().future];
    const nextHistory = get().history.slice(0, -1);
    accessors.applySession(cloneAudioSession(previousSession));
    set({
      past: nextPast,
      future: nextFuture,
      history: nextHistory,
      ...getStackState(nextPast, nextFuture),
    });
  },
  redo: (): void => {
    const currentSession = accessors?.getSession();
    const nextSession = get().future[0];

    if (!currentSession || !nextSession || !accessors) {
      return;
    }

    const nextPast = [...get().past, cloneAudioSession(currentSession)].slice(-UNDO_STACK_LIMIT);
    const nextFuture = get().future.slice(1);
    accessors.applySession(cloneAudioSession(nextSession));
    set({
      past: nextPast,
      future: nextFuture,
      ...getStackState(nextPast, nextFuture),
    });
  },
  undoTo: (historyIndex: number): void => {
    const steps = get().past.length - historyIndex;

    for (let index = 0; index < steps; index += 1) {
      get().undo();
    }
  },
  clear: (): void => {
    set({
      past: [],
      future: [],
      history: [],
      canUndo: false,
      canRedo: false,
    });
  },
}));
