import type { CuePoint, WaveformRegion } from "@/types/audio";

export interface WaveformDisplayProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  regions: WaveformRegion[];
  cuePoints: CuePoint[];
  bpm: number | null;
  beatOffset: number;
  beatGridVisible: boolean;
  snapEnabled: boolean;
  onSeek: (seconds: number) => void;
  onRegionChange: (region: WaveformRegion) => void;
  onRegionClick: (regionId: string) => void;
  onCueAdd: (position: number) => void;
  onCueSelect: (cueId: string) => void;
  onCueMove: (cue: CuePoint) => void;
  onCueDelete: (cueId: string) => void;
  onCueRenameRequest: (cueId: string) => void;
}
