export type AudioFormat = "wav" | "mp3" | "aiff" | "flac";
export type MetadataSource = "auto" | "manual";
export type BleepMode = "bleep" | "mute" | "duck";
export type EditorTab = "edit" | "clean" | "swap" | "transition" | "history";

export interface AudioFile {
  id: string;
  name: string;
  format: AudioFormat;
  sizeBytes: number;
  durationSeconds: number;
  bpm: number | null;
  key: string | null;
  beatOffset: number;
  url: string;
  sourceFile: File;
  createdAt: number;
}

export interface WaveformRegion {
  id: string;
  start: number;
  end: number;
  type: "intro" | "outro" | "loop" | "selection";
  color: string;
  label: string;
}

export interface CuePoint {
  id: string;
  position: number;
  label: string;
  color: string;
  hotkey: number | null;
}

export interface BleepRegion {
  id: string;
  start: number;
  end: number;
  mode: BleepMode;
  label: string;
}

export interface TransitionCue {
  id: string;
  position: number;
  windowSeconds: number;
  inPoint: number;
  outPoint: number;
  type: "mix-in" | "mix-out";
  label: string;
}

export interface AcapellaSwapCommit {
  id: string;
  vocalsGain: number;
  instrumentalGain: number;
  offsetSeconds: number;
  committedAt: number;
}

export interface AudioSession {
  file: AudioFile;
  regions: WaveformRegion[];
  cuePoints: CuePoint[];
  bleepRegions: BleepRegion[];
  transitionCues: TransitionCue[];
  acapellaSwap: AcapellaSwapCommit | null;
  playheadPosition: number;
  isPlaying: boolean;
  zoom: number;
  bpmSource: MetadataSource | null;
  keySource: MetadataSource | null;
  autoBpm: number | null;
  autoKey: string | null;
}

export interface EditorSettings {
  snapDivision: 1 | 2 | 4 | null;
  activeRegionId: string | null;
  activeCueId: string | null;
  beatGridVisible: boolean;
  stemModel: "2stems" | "4stems";
  activeTab: EditorTab;
}
