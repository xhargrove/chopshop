"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { ACCEPTED_AUDIO_EXTENSIONS, AUDIO_EXTENSION_FORMATS, CUE_COLORS, DEFAULT_AUDIO_ZOOM, MAX_HOTKEY_CUE_POINTS } from "@/lib/constants";
import type { AudioFile, AudioFormat, AudioSession, CuePoint, EditorSettings, WaveformRegion } from "@/types/audio";

export interface AudioStore {
  session: AudioSession | null;
  editorSettings: EditorSettings;
  loadFile: (file: File) => Promise<void>;
  clearSession: () => void;
  updateRegions: (regions: WaveformRegion[]) => void;
  updateCuePoints: (cuePoints: CuePoint[]) => void;
  setPlayhead: (position: number) => void;
  setSnapDivision: (division: 1 | 2 | 4 | null) => void;
  setActiveRegion: (id: string | null) => void;
  setActiveCue: (id: string | null) => void;
  setFileBpm: (bpm: number | null) => void;
  addCuePoint: (position: number) => void;
  removeCuePoint: (id: string) => void;
  updateCuePoint: (id: string, updates: Partial<CuePoint>) => void;
}

const createInitialEditorSettings = (): EditorSettings => ({
  snapDivision: null,
  activeRegionId: null,
  activeCueId: null,
});

const getAudioFormat = (fileName: string): AudioFormat => {
  const normalizedName = fileName.toLowerCase();
  const extension = ACCEPTED_AUDIO_EXTENSIONS.find((candidate) => normalizedName.endsWith(candidate));

  if (!extension) {
    throw new Error("Unsupported audio file format.");
  }

  return AUDIO_EXTENSION_FORMATS[extension];
};

const decodeDuration = async (file: File): Promise<number> => {
  const audioContext = new AudioContext();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer.duration;
  } finally {
    await audioContext.close();
  }
};

const revokeSessionUrl = (session: AudioSession | null): void => {
  if (session) {
    URL.revokeObjectURL(session.file.url);
  }
};

const getNextCueColor = (cueCount: number): string => CUE_COLORS[cueCount % CUE_COLORS.length];

const getNextHotkey = (cuePoints: CuePoint[]): number | null => {
  const assignedHotkeys = new Set(cuePoints.map((cuePoint) => cuePoint.hotkey).filter((hotkey): hotkey is number => hotkey !== null));

  for (let hotkey = 1; hotkey <= MAX_HOTKEY_CUE_POINTS; hotkey += 1) {
    if (!assignedHotkeys.has(hotkey)) {
      return hotkey;
    }
  }

  return null;
};

export const useAudioStore = create<AudioStore>()(
  immer((set, get) => ({
    session: null,
    // PHASE 2 CHANGE: Editor settings live beside the audio session so panels and overlays share selection/snap state.
    editorSettings: createInitialEditorSettings(),
    loadFile: async (file: File): Promise<void> => {
      const durationSeconds = await decodeDuration(file);
      const nextUrl = URL.createObjectURL(file);
      const previousSession = get().session;

      revokeSessionUrl(previousSession);

      const audioFile: AudioFile = {
        id: nanoid(),
        name: file.name,
        format: getAudioFormat(file.name),
        sizeBytes: file.size,
        durationSeconds,
        bpm: null,
        key: null,
        url: nextUrl,
        createdAt: Date.now(),
      };

      set((state) => {
        state.session = {
          file: audioFile,
          regions: [],
          cuePoints: [],
          playheadPosition: 0,
          isPlaying: false,
          zoom: DEFAULT_AUDIO_ZOOM,
        };
      });
    },
    clearSession: (): void => {
      revokeSessionUrl(get().session);

      set((state) => {
        state.session = null;
        state.editorSettings = createInitialEditorSettings();
      });
    },
    updateRegions: (regions: WaveformRegion[]): void => {
      set((state) => {
        if (state.session) {
          state.session.regions = regions;
        }
      });
    },
    updateCuePoints: (cuePoints: CuePoint[]): void => {
      set((state) => {
        if (state.session) {
          state.session.cuePoints = cuePoints;
        }
      });
    },
    setPlayhead: (position: number): void => {
      set((state) => {
        if (state.session) {
          state.session.playheadPosition = position;
        }
      });
    },
    setSnapDivision: (division: 1 | 2 | 4 | null): void => {
      set((state) => {
        state.editorSettings.snapDivision = division;
      });
    },
    setActiveRegion: (id: string | null): void => {
      set((state) => {
        state.editorSettings.activeRegionId = id;
      });
    },
    setActiveCue: (id: string | null): void => {
      set((state) => {
        state.editorSettings.activeCueId = id;
      });
    },
    setFileBpm: (bpm: number | null): void => {
      set((state) => {
        if (state.session) {
          state.session.file.bpm = bpm;
        }
      });
    },
    addCuePoint: (position: number): void => {
      set((state) => {
        if (!state.session) {
          return;
        }

        const cueCount = state.session.cuePoints.length;
        const cuePoint: CuePoint = {
          id: nanoid(),
          position,
          label: `Cue ${cueCount + 1}`,
          color: getNextCueColor(cueCount),
          hotkey: getNextHotkey(state.session.cuePoints),
        };

        state.session.cuePoints.push(cuePoint);
        state.editorSettings.activeCueId = cuePoint.id;
      });
    },
    removeCuePoint: (id: string): void => {
      set((state) => {
        if (!state.session) {
          return;
        }

        state.session.cuePoints = state.session.cuePoints.filter((cuePoint) => cuePoint.id !== id);

        if (state.editorSettings.activeCueId === id) {
          state.editorSettings.activeCueId = null;
        }
      });
    },
    updateCuePoint: (id: string, updates: Partial<CuePoint>): void => {
      set((state) => {
        const cuePoint = state.session?.cuePoints.find((candidate) => candidate.id === id);

        if (cuePoint) {
          Object.assign(cuePoint, updates);
        }
      });
    },
  })),
);
