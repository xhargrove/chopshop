import type { BleepRegion, CuePoint, TransitionCue, WaveformRegion } from "@/types/audio";

export interface WaveformDisplayProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  regions: WaveformRegion[];
  cuePoints: CuePoint[];
  bpm: number | null;
  beatOffset: number;
  beatGridVisible: boolean;
  bleepRegions: BleepRegion[];
  transitionCues: TransitionCue[];
  snapEnabled: boolean;
  prepareMode: boolean;
  activeHotkeySlot: number;
  isPlaying: boolean;
  bindPlaybackEngine?: (wavesurfer: import("wavesurfer.js").default) => () => void;
  onSeek: (seconds: number) => void;
  onRegionChange: (region: WaveformRegion) => void;
  onRegionClick: (regionId: string) => void;
  onCueAdd: (position: number) => void;
  onCueSetAtHotkey: (hotkey: number, position: number) => void;
  onCueSelect: (cueId: string) => void;
  onCueMove: (cue: CuePoint) => void;
  onCueDelete: (cueId: string) => void;
  onCueRenameRequest: (cueId: string) => void;
}
