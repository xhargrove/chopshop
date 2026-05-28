import { BeatGridLayer } from "@/components/waveform/BeatGridLayer";
import { BleepRegionLayer } from "@/components/waveform/BleepRegionLayer";
import { CuePointLayer } from "@/components/waveform/CuePointLayer";
import { RegionLayer } from "@/components/waveform/RegionLayer";
import { TransitionCueLayer } from "@/components/waveform/TransitionCueLayer";
import type { BleepRegion, CuePoint, TransitionCue, WaveformRegion } from "@/types/audio";

interface WaveformOverlaysProps {
  duration: number;
  containerWidthPx: number;
  secondsPerPixel: number;
  regions: WaveformRegion[];
  cuePoints: CuePoint[];
  bleepRegions: BleepRegion[];
  transitionCues: TransitionCue[];
  bpm: number | null;
  beatOffset: number;
  beatGridVisible: boolean;
  snapEnabled: boolean;
  scrollOffsetSeconds: number;
  prepareMode: boolean;
  activeHotkeySlot: number;
  onRegionChange: (region: WaveformRegion) => void;
  onRegionClick: (regionId: string) => void;
  onCueAdd: (position: number) => void;
  onCueSetAtHotkey: (hotkey: number, position: number) => void;
  onCueSelect: (cueId: string) => void;
  onCueMove: (cue: CuePoint) => void;
  onCueDelete: (cueId: string) => void;
  onCueRenameRequest: (cueId: string) => void;
}

export function WaveformOverlays({
  duration,
  containerWidthPx,
  secondsPerPixel,
  regions,
  cuePoints,
  bleepRegions,
  transitionCues,
  bpm,
  beatOffset,
  beatGridVisible,
  snapEnabled,
  scrollOffsetSeconds,
  prepareMode,
  activeHotkeySlot,
  onRegionChange,
  onRegionClick,
  onCueAdd,
  onCueSetAtHotkey,
  onCueSelect,
  onCueMove,
  onCueDelete,
  onCueRenameRequest,
}: WaveformOverlaysProps) {
  if (containerWidthPx <= 0 || secondsPerPixel <= 0) {
    return null;
  }

  return (
    <>
      {bpm ? (
        <BeatGridLayer
          bpm={bpm}
          beatOffset={beatOffset}
          durationSeconds={duration}
          containerWidthPx={containerWidthPx}
          scrollOffsetSeconds={scrollOffsetSeconds}
          secondsPerPixel={secondsPerPixel}
          visible={beatGridVisible}
        />
      ) : null}
      <RegionLayer
        regions={regions}
        durationSeconds={duration}
        containerWidthPx={containerWidthPx}
        scrollOffsetSeconds={scrollOffsetSeconds}
        secondsPerPixel={secondsPerPixel}
        bpm={bpm}
        snapEnabled={snapEnabled}
        onRegionChange={onRegionChange}
        onRegionClick={onRegionClick}
      />
      <CuePointLayer
        cuePoints={cuePoints}
        durationSeconds={duration}
        containerWidthPx={containerWidthPx}
        scrollOffsetSeconds={scrollOffsetSeconds}
        secondsPerPixel={secondsPerPixel}
        prepareMode={prepareMode}
        activeHotkeySlot={activeHotkeySlot}
        onCueAdd={onCueAdd}
        onCueSetAtHotkey={onCueSetAtHotkey}
        onCueSelect={onCueSelect}
        onCueMove={onCueMove}
        onCueDelete={onCueDelete}
        onCueRenameRequest={onCueRenameRequest}
      />
      <BleepRegionLayer regions={bleepRegions} containerWidthPx={containerWidthPx} scrollOffsetSeconds={scrollOffsetSeconds} secondsPerPixel={secondsPerPixel} />
      <TransitionCueLayer cues={transitionCues} containerWidthPx={containerWidthPx} scrollOffsetSeconds={scrollOffsetSeconds} secondsPerPixel={secondsPerPixel} />
    </>
  );
}
