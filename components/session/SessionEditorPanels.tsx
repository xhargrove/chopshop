"use client";

import { BeatOffsetControl } from "@/components/editor/BeatOffsetControl";
import { CuePointPanel } from "@/components/editor/CuePointPanel";
import { IntroOutroPanel } from "@/components/editor/IntroOutroPanel";
import { StemPlayer } from "@/components/stems/StemPlayer";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import type { AudioSession, WaveformRegion } from "@/types/audio";
import type { StemType } from "@/types/stems";

interface SessionEditorPanelsProps {
  session: AudioSession;
  currentTime: number;
  snapDivision: 1 | 2 | 4 | null;
  activeCueId: string | null;
  renameCueId: string | null;
  showBeatOffset: boolean;
  showStems: boolean;
  stems: Partial<Record<StemType, AudioBuffer>>;
  onBpmChange: (bpm: number | null) => void;
  onSnapDivisionChange: (division: 1 | 2 | 4 | null) => void;
  onSetBoundary: (type: WaveformRegion["type"], boundary: "start" | "end", position: number) => void;
  onClearRegion: (type: WaveformRegion["type"]) => void;
  onExtendRegion: (type: WaveformRegion["type"], bars: number) => void;
  onTrimRegion: (type: WaveformRegion["type"], bars: number) => void;
  onBeatOffsetChange: (offsetSeconds: number) => void;
  onResetBpm: () => void;
  onAddCue: (position: number) => void;
  onSelectCue: (cueId: string | null) => void;
  onSeek: (seconds: number) => void;
  onRenameCue: (cueId: string, label: string) => void;
  onRenameHandled: () => void;
  onOpenExport: () => void;
}

export function SessionEditorPanels({
  session,
  currentTime,
  snapDivision,
  activeCueId,
  renameCueId,
  showBeatOffset,
  showStems,
  stems,
  onBpmChange,
  onSnapDivisionChange,
  onSetBoundary,
  onClearRegion,
  onExtendRegion,
  onTrimRegion,
  onBeatOffsetChange,
  onResetBpm,
  onAddCue,
  onSelectCue,
  onSeek,
  onRenameCue,
  onRenameHandled,
  onOpenExport,
}: SessionEditorPanelsProps) {
  return (
    <>
      <ErrorBoundary fallbackTitle="Editor failed" fallbackMessage="Intro and outro controls could not render.">
        <IntroOutroPanel
          regions={session.regions}
          currentTime={currentTime}
          bpm={session.file.bpm}
          snapDivision={snapDivision}
          onBpmChange={onBpmChange}
          onSnapDivisionChange={onSnapDivisionChange}
          onSetBoundary={onSetBoundary}
          onClearRegion={onClearRegion}
          onExtendRegion={onExtendRegion}
          onTrimRegion={onTrimRegion}
        />
      </ErrorBoundary>
      {showBeatOffset ? (
        <ErrorBoundary fallbackTitle="Beat grid failed" fallbackMessage="Beat grid controls could not render.">
          <BeatOffsetControl
            currentTime={currentTime}
            bpm={session.file.bpm}
            autoBpm={session.autoBpm}
            beatOffset={session.file.beatOffset}
            bpmSource={session.bpmSource}
            onManualBpm={(bpm) => onBpmChange(bpm)}
            onResetBpm={onResetBpm}
            onBeatOffsetChange={onBeatOffsetChange}
          />
        </ErrorBoundary>
      ) : null}
      {showStems && Object.keys(stems).length > 0 ? (
        <ErrorBoundary fallbackTitle="Stem player failed" fallbackMessage="Stem playback controls could not render.">
          <StemPlayer
            stems={stems}
            currentTime={currentTime}
            durationSeconds={session.file.durationSeconds}
            isPlaying={false}
            onExportStems={onOpenExport}
            onMixToStereo={onOpenExport}
          />
        </ErrorBoundary>
      ) : null}
      <ErrorBoundary fallbackTitle="Cue panel failed" fallbackMessage="Cue point controls could not render.">
        <CuePointPanel
          cuePoints={session.cuePoints}
          activeCueId={activeCueId}
          renameCueId={renameCueId}
          currentTime={currentTime}
          onAddCue={onAddCue}
          onSelectCue={onSelectCue}
          onSeek={onSeek}
          onRenameCue={onRenameCue}
          onRenameHandled={onRenameHandled}
        />
      </ErrorBoundary>
    </>
  );
}
