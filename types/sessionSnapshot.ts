import type { AudioFormat, AudioSession, EditorSettings } from "@/types/audio";

export const SESSION_SNAPSHOT_VERSION = 1 as const;

export interface PersistedFileMeta {
  name: string;
  format: AudioFormat;
  sizeBytes: number;
  durationSeconds: number;
  bpm: number | null;
  key: string | null;
  beatOffset: number;
  lastModified: number;
}

export interface PersistedSessionPayload {
  regions: AudioSession["regions"];
  cuePoints: AudioSession["cuePoints"];
  bleepRegions: AudioSession["bleepRegions"];
  transitionCues: AudioSession["transitionCues"];
  acapellaSwap: AudioSession["acapellaSwap"];
  playheadPosition: number;
  bpmSource: AudioSession["bpmSource"];
  keySource: AudioSession["keySource"];
  autoBpm: AudioSession["autoBpm"];
  autoKey: AudioSession["autoKey"];
}

export interface SessionSnapshot {
  version: typeof SESSION_SNAPSHOT_VERSION;
  savedAt: number;
  fileKey: string;
  fileMeta: PersistedFileMeta;
  session: PersistedSessionPayload;
  editorSettings: EditorSettings;
}
