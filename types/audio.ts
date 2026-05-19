export type AudioFormat = "wav" | "mp3" | "aiff" | "flac";

export interface AudioFile {
  id: string;
  name: string;
  format: AudioFormat;
  sizeBytes: number;
  durationSeconds: number;
  bpm: number | null;
  key: string | null;
  url: string;
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

export interface AudioSession {
  file: AudioFile;
  regions: WaveformRegion[];
  cuePoints: CuePoint[];
  playheadPosition: number;
  isPlaying: boolean;
  zoom: number;
}

export interface EditorSettings {
  snapDivision: 1 | 2 | 4 | null;
  activeRegionId: string | null;
  activeCueId: string | null;
}
