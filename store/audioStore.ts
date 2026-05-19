"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { ACCEPTED_AUDIO_EXTENSIONS, AUDIO_EXTENSION_FORMATS, DEFAULT_AUDIO_ZOOM } from "@/lib/constants";
import type { AudioFile, AudioFormat, AudioSession, CuePoint, WaveformRegion } from "@/types/audio";

interface AudioStore {
  session: AudioSession | null;
  loadFile: (file: File) => Promise<void>;
  clearSession: () => void;
  updateRegions: (regions: WaveformRegion[]) => void;
  updateCuePoints: (cuePoints: CuePoint[]) => void;
  setPlayhead: (position: number) => void;
}

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

export const useAudioStore = create<AudioStore>()(
  immer((set, get) => ({
    session: null,
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
  })),
);
