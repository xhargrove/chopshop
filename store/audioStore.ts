"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import {
  ACCEPTED_AUDIO_EXTENSIONS,
  AUDIO_EXTENSION_FORMATS,
  CUE_COLORS,
  DEFAULT_AUDIO_ZOOM,
  DEFAULT_BEAT_OFFSET_SECONDS,
  DEFAULT_STEM_MODEL,
  DEFAULT_TRANSITION_BEATS,
  MAX_BPM,
  MAX_HOTKEY_CUE_POINTS,
  MIN_BPM,
  VALID_CAMELOT_VALUES,
} from "@/lib/constants";
import { audioBufferCache } from "@/lib/audioBufferCache";
import { createExportDefaultsFromPreset, DEFAULT_EXPORT_DEFAULTS } from "@/lib/export/exportDefaults";
import { clearSessionSnapshot, findMatchingSnapshot, mergeSnapshotIntoSession } from "@/lib/sessionPersistence";
import { generateSmartPrepDraft, mergeSmartPrepDraft } from "@/lib/smartPrep";
import { getWorkflowPreset } from "@/lib/workflowPresets";
import { registerUndoSessionAccessors, useUndoStore } from "@/store/undoStore";
import type {
  AcapellaSwapCommit,
  AudioFile,
  AudioFormat,
  AudioSession,
  BleepMode,
  BleepRegion,
  CuePoint,
  EditorSettings,
  EditorTabId,
  MetadataSource,
  TransitionCue,
  WaveformRegion,
  WorkflowPresetId,
} from "@/types/audio";

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
  setBpm: (bpm: number, source: MetadataSource) => void;
  setKey: (key: string, source: MetadataSource) => void;
  setBeatOffset: (offsetSeconds: number) => void;
  setBeatGridVisible: (visible: boolean) => void;
  setStemModel: (model: "2stems" | "4stems") => void;
  setActiveTab: (tab: EditorTabId) => void;
  updateBleepRegions: (regions: BleepRegion[]) => void;
  addBleepRegion: (start: number, end: number, mode: BleepMode) => void;
  removeBleepRegion: (id: string) => void;
  addTransitionCue: (position: number, type: TransitionCue["type"], windowSeconds?: number) => void;
  removeTransitionCue: (id: string) => void;
  commitAcapellaSwap: (commit: Omit<AcapellaSwapCommit, "id" | "committedAt">) => void;
  clearAcapellaSwap: () => void;
  replaceSession: (session: AudioSession) => void;
  resetBpmOverride: () => void;
  resetKeyOverride: () => void;
  addCuePoint: (position: number) => void;
  setCueAtHotkey: (hotkey: number, position: number) => void;
  clearCueAtHotkey: (hotkey: number) => void;
  removeCuePoint: (id: string) => void;
  updateCuePoint: (id: string, updates: Partial<CuePoint>) => void;
  setActiveHotkeySlot: (hotkey: number) => void;
  applyWorkflowPreset: (presetId: WorkflowPresetId) => void;
  applySmartPrep: () => void;
  markAutosaved: (timestamp: number) => void;
}

const createInitialEditorSettings = (): EditorSettings => ({
  snapDivision: 4,
  activeRegionId: null,
  activeCueId: null,
  activeHotkeySlot: 1,
  beatGridVisible: true,
  stemModel: DEFAULT_STEM_MODEL,
  activeTab: "prepare",
  activeWorkflowPreset: "serato-prep",
  lastAutosaveAt: null,
  exportDefaults: DEFAULT_EXPORT_DEFAULTS,
});

const getNextHotkeySlot = (currentSlot: number): number => (currentSlot % MAX_HOTKEY_CUE_POINTS) + 1;

const roundBpm = (bpm: number): number => Number(Math.min(Math.max(bpm, MIN_BPM), MAX_BPM).toFixed(2));

const pushUndoSnapshot = (session: AudioSession | null, label: string): void => {
  if (session) {
    useUndoStore.getState().pushState(session, label);
  }
};

const getAudioFormat = (fileName: string): AudioFormat => {
  const normalizedName = fileName.toLowerCase();
  const extension = ACCEPTED_AUDIO_EXTENSIONS.find((candidate) => normalizedName.endsWith(candidate));

  if (!extension) {
    throw new Error("Unsupported audio file format.");
  }

  return AUDIO_EXTENSION_FORMATS[extension];
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
      audioBufferCache.invalidate();
      const { buffer } = await audioBufferCache.getOrDecode(file);
      const durationSeconds = buffer.duration;
      const nextUrl = URL.createObjectURL(file);
      const previousSession = get().session;

      revokeSessionUrl(previousSession);
      useUndoStore.getState().clear();

      const audioFile: AudioFile = {
        id: nanoid(),
        name: file.name,
        format: getAudioFormat(file.name),
        sizeBytes: file.size,
        durationSeconds,
        bpm: null,
        key: null,
        beatOffset: DEFAULT_BEAT_OFFSET_SECONDS,
        url: nextUrl,
        sourceFile: file,
        createdAt: Date.now(),
      };

      set((state) => {
        state.session = {
          file: audioFile,
          regions: [],
          cuePoints: [],
          bleepRegions: [],
          transitionCues: [],
          acapellaSwap: null,
          playheadPosition: 0,
          isPlaying: false,
          zoom: DEFAULT_AUDIO_ZOOM,
          bpmSource: null,
          keySource: null,
          autoBpm: null,
          autoKey: null,
        };
      });

      const snapshot = findMatchingSnapshot(file);
      const currentSession = get().session;

      if (snapshot && currentSession) {
        pushUndoSnapshot(currentSession, "Restore autosave");
        set((state) => {
          if (!state.session) {
            return;
          }

          state.session = mergeSnapshotIntoSession(state.session, snapshot);
          state.editorSettings = {
            ...createInitialEditorSettings(),
            ...snapshot.editorSettings,
            exportDefaults: snapshot.editorSettings.exportDefaults ?? DEFAULT_EXPORT_DEFAULTS,
            lastAutosaveAt: snapshot.savedAt,
          };
        });
      }
    },
    clearSession: (): void => {
      revokeSessionUrl(get().session);
      useUndoStore.getState().clear();
      clearSessionSnapshot();
      audioBufferCache.invalidate();

      set((state) => {
        state.session = null;
        state.editorSettings = createInitialEditorSettings();
      });
    },
    markAutosaved: (timestamp: number): void => {
      set((state) => {
        state.editorSettings.lastAutosaveAt = timestamp;
      });
    },
    applyWorkflowPreset: (presetId: WorkflowPresetId): void => {
      const preset = getWorkflowPreset(presetId);

      if (!preset) {
        return;
      }

      set((state) => {
        state.editorSettings.activeTab = preset.activeTab;
        state.editorSettings.snapDivision = preset.snapDivision;
        state.editorSettings.beatGridVisible = preset.beatGridVisible;
        state.editorSettings.activeWorkflowPreset = presetId;
        state.editorSettings.exportDefaults = createExportDefaultsFromPreset(preset);
      });
    },
    applySmartPrep: (): void => {
      const session = get().session;

      if (!session) {
        return;
      }

      pushUndoSnapshot(session, "Apply Smart Prep");
      const draft = generateSmartPrepDraft(session);

      set((state) => {
        if (state.session) {
          state.session = mergeSmartPrepDraft(state.session, draft);
        }
      });
    },
    updateRegions: (regions: WaveformRegion[]): void => {
      pushUndoSnapshot(get().session, "Update regions");
      set((state) => {
        if (state.session) {
          state.session.regions = regions;
        }
      });
    },
    updateCuePoints: (cuePoints: CuePoint[]): void => {
      pushUndoSnapshot(get().session, "Update cue points");
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
      pushUndoSnapshot(get().session, "Set BPM");
      set((state) => {
        if (state.session) {
          state.session.file.bpm = bpm === null ? null : roundBpm(bpm);
          state.session.bpmSource = bpm === null ? null : "manual";
        }
      });
    },
    setBpm: (bpm: number, source: MetadataSource): void => {
      pushUndoSnapshot(get().session, "Set BPM");
      set((state) => {
        if (!state.session) {
          return;
        }

        const roundedBpm = roundBpm(bpm);

        if (source === "auto") {
          state.session.autoBpm = roundedBpm;

          if (state.session.bpmSource === "manual") {
            return;
          }
        }

        state.session.file.bpm = roundedBpm;
        state.session.bpmSource = source;
      });
    },
    setKey: (key: string, source: MetadataSource): void => {
      pushUndoSnapshot(get().session, "Set key");
      set((state) => {
        if (!state.session || !VALID_CAMELOT_VALUES.has(key)) {
          return;
        }

        if (source === "auto") {
          state.session.autoKey = key;

          if (state.session.keySource === "manual") {
            return;
          }
        }

        state.session.file.key = key;
        state.session.keySource = source;
      });
    },
    setBeatOffset: (offsetSeconds: number): void => {
      pushUndoSnapshot(get().session, "Set beat offset");
      set((state) => {
        if (state.session) {
          state.session.file.beatOffset = offsetSeconds;
        }
      });
    },
    setBeatGridVisible: (visible: boolean): void => {
      set((state) => {
        state.editorSettings.beatGridVisible = visible;
      });
    },
    setStemModel: (model: "2stems" | "4stems"): void => {
      set((state) => {
        state.editorSettings.stemModel = model;
      });
    },
    setActiveTab: (tab: EditorTabId): void => {
      set((state) => {
        state.editorSettings.activeTab = tab;
      });
    },
    updateBleepRegions: (regions: BleepRegion[]): void => {
      pushUndoSnapshot(get().session, "Update clean edit regions");
      set((state) => {
        if (state.session) {
          state.session.bleepRegions = regions;
        }
      });
    },
    addBleepRegion: (start: number, end: number, mode: BleepMode): void => {
      pushUndoSnapshot(get().session, "Add clean edit region");
      set((state) => {
        if (state.session) {
          state.session.bleepRegions.push({ id: nanoid(), start, end, mode, label: `${mode} ${state.session.bleepRegions.length + 1}` });
        }
      });
    },
    removeBleepRegion: (id: string): void => {
      pushUndoSnapshot(get().session, "Remove clean edit region");
      set((state) => {
        if (state.session) {
          state.session.bleepRegions = state.session.bleepRegions.filter((region) => region.id !== id);
        }
      });
    },
    addTransitionCue: (position: number, type: TransitionCue["type"], windowSeconds?: number): void => {
      pushUndoSnapshot(get().session, "Add transition cue");
      set((state) => {
        if (!state.session) {
          return;
        }

        const bpm = state.session.file.bpm ?? MIN_BPM;
        const windowLength = windowSeconds ?? (DEFAULT_TRANSITION_BEATS * 60) / bpm;
        state.session.transitionCues.push({
          id: nanoid(),
          position,
          windowSeconds: windowLength,
          inPoint: Math.max(position - windowLength / 2, 0),
          outPoint: Math.min(position + windowLength / 2, state.session.file.durationSeconds),
          type,
          label: type === "mix-in" ? "Mix In" : "Mix Out",
        });
      });
    },
    removeTransitionCue: (id: string): void => {
      pushUndoSnapshot(get().session, "Remove transition cue");
      set((state) => {
        if (state.session) {
          state.session.transitionCues = state.session.transitionCues.filter((cue) => cue.id !== id);
        }
      });
    },
    commitAcapellaSwap: (commit: Omit<AcapellaSwapCommit, "id" | "committedAt">): void => {
      pushUndoSnapshot(get().session, "Commit acapella swap");
      set((state) => {
        if (state.session) {
          state.session.acapellaSwap = { ...commit, id: nanoid(), committedAt: Date.now() };
        }
      });
    },
    clearAcapellaSwap: (): void => {
      pushUndoSnapshot(get().session, "Clear acapella swap");
      set((state) => {
        if (state.session) {
          state.session.acapellaSwap = null;
        }
      });
    },
    replaceSession: (session: AudioSession): void => {
      set((state) => {
        state.session = session;
      });
    },
    resetBpmOverride: (): void => {
      pushUndoSnapshot(get().session, "Reset BPM override");
      set((state) => {
        if (state.session) {
          state.session.file.bpm = state.session.autoBpm;
          state.session.bpmSource = state.session.autoBpm === null ? null : "auto";
        }
      });
    },
    resetKeyOverride: (): void => {
      pushUndoSnapshot(get().session, "Reset key override");
      set((state) => {
        if (state.session) {
          state.session.file.key = state.session.autoKey;
          state.session.keySource = state.session.autoKey === null ? null : "auto";
        }
      });
    },
    addCuePoint: (position: number): void => {
      pushUndoSnapshot(get().session, "Add cue point");
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
    setCueAtHotkey: (hotkey: number, position: number): void => {
      if (hotkey < 1 || hotkey > MAX_HOTKEY_CUE_POINTS) {
        return;
      }

      pushUndoSnapshot(get().session, `Set cue ${hotkey}`);
      set((state) => {
        if (!state.session) {
          return;
        }

        const color = CUE_COLORS[hotkey - 1];
        const existing = state.session.cuePoints.find((cuePoint) => cuePoint.hotkey === hotkey);

        if (existing) {
          existing.position = position;
          state.editorSettings.activeCueId = existing.id;
          state.editorSettings.activeHotkeySlot = getNextHotkeySlot(hotkey);
          return;
        }

        const cuePoint: CuePoint = {
          id: nanoid(),
          position,
          label: `Cue ${hotkey}`,
          color,
          hotkey,
        };

        state.session.cuePoints.push(cuePoint);
        state.editorSettings.activeCueId = cuePoint.id;
        state.editorSettings.activeHotkeySlot = getNextHotkeySlot(hotkey);
      });
    },
    clearCueAtHotkey: (hotkey: number): void => {
      pushUndoSnapshot(get().session, `Clear cue ${hotkey}`);
      set((state) => {
        if (!state.session) {
          return;
        }

        const removed = state.session.cuePoints.find((cuePoint) => cuePoint.hotkey === hotkey);
        state.session.cuePoints = state.session.cuePoints.filter((cuePoint) => cuePoint.hotkey !== hotkey);

        if (removed && state.editorSettings.activeCueId === removed.id) {
          state.editorSettings.activeCueId = null;
        }
      });
    },
    setActiveHotkeySlot: (hotkey: number): void => {
      set((state) => {
        if (hotkey >= 1 && hotkey <= MAX_HOTKEY_CUE_POINTS) {
          state.editorSettings.activeHotkeySlot = hotkey;
        }
      });
    },
    removeCuePoint: (id: string): void => {
      pushUndoSnapshot(get().session, "Remove cue point");
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
      pushUndoSnapshot(get().session, "Update cue point");
      set((state) => {
        const cuePoint = state.session?.cuePoints.find((candidate) => candidate.id === id);

        if (cuePoint) {
          Object.assign(cuePoint, updates);
        }
      });
    },
  })),
);

registerUndoSessionAccessors({
  getSession: () => useAudioStore.getState().session,
  applySession: (session) => useAudioStore.getState().replaceSession(session),
});
