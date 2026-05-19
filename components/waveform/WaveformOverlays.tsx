import { BeatGridLayer } from "@/components/waveform/BeatGridLayer";
import { CuePointLayer } from "@/components/waveform/CuePointLayer";
import { RegionLayer } from "@/components/waveform/RegionLayer";
import type { CuePoint, WaveformRegion } from "@/types/audio";

interface WaveformOverlaysProps {
  duration: number;
  containerWidthPx: number;
  secondsPerPixel: number;
  regions: WaveformRegion[];
  cuePoints: CuePoint[];
  bpm: number | null;
  beatOffset: number;
  beatGridVisible: boolean;
  snapEnabled: boolean;
  onRegionChange: (region: WaveformRegion) => void;
  onRegionClick: (regionId: string) => void;
  onCueAdd: (position: number) => void;
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
  bpm,
  beatOffset,
  beatGridVisible,
  snapEnabled,
  onRegionChange,
  onRegionClick,
  onCueAdd,
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
          scrollOffsetSeconds={0}
          secondsPerPixel={secondsPerPixel}
          visible={beatGridVisible}
        />
      ) : null}
      <RegionLayer
        regions={regions}
        durationSeconds={duration}
        containerWidthPx={containerWidthPx}
        scrollOffsetSeconds={0}
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
        scrollOffsetSeconds={0}
        secondsPerPixel={secondsPerPixel}
        onCueAdd={onCueAdd}
        onCueSelect={onCueSelect}
        onCueMove={onCueMove}
        onCueDelete={onCueDelete}
        onCueRenameRequest={onCueRenameRequest}
      />
    </>
  );
}
