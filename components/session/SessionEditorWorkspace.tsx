"use client";

import { AcapellaSwap } from "@/components/editor/AcapellaSwap";
import { BeatOffsetControl } from "@/components/editor/BeatOffsetControl";
import { CuePointPanel } from "@/components/editor/CuePointPanel";
import { PreparePanel } from "@/components/editor/PreparePanel";
import { EditHistory } from "@/components/editor/EditHistory";
import { EditorTabs } from "@/components/editor/EditorTabs";
import { IntroOutroPanel } from "@/components/editor/IntroOutroPanel";
import { RadioEditPanel } from "@/components/editor/RadioEditPanel";
import { TransitionCuePanel } from "@/components/editor/TransitionCuePanel";
import { StemPlayer } from "@/components/stems/StemPlayer";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useAudioStore } from "@/store/audioStore";
import type { AudioSession, BleepMode, EditorTabId, WaveformRegion, WorkflowPresetId } from "@/types/audio";
import type { StemType } from "@/types/stems";

interface SessionEditorWorkspaceProps {
  session: AudioSession;
  currentTime: number;
  durationSeconds: number;
  isPlaying: boolean;
  snapDivision: 1 | 2 | 4 | null;
  activeTab: EditorTabId;
  activeCueId: string | null;
  activeHotkeySlot: number;
  renameCueId: string | null;
  showBeatOffset: boolean;
  showStems: boolean;
  stems: Partial<Record<StemType, AudioBuffer>>;
  onTabChange: (tab: EditorTabId) => void;
  onBpmChange: (bpm: number | null) => void;
  onSnapDivisionChange: (division: 1 | 2 | 4 | null) => void;
  onSetBoundary: (type: WaveformRegion["type"], boundary: "start" | "end", position: number) => void;
  onClearRegion: (type: WaveformRegion["type"]) => void;
  onExtendRegion: (type: WaveformRegion["type"], bars: number) => void;
  onTrimRegion: (type: WaveformRegion["type"], bars: number) => void;
  onBeatOffsetChange: (offsetSeconds: number) => void;
  onResetBpm: () => void;
  onAddCue: (position: number) => void;
  onSetCueAtHotkey: (hotkey: number, position: number) => void;
  onClearCueAtHotkey: (hotkey: number) => void;
  onSelectHotkeySlot: (hotkey: number) => void;
  onSelectCue: (cueId: string | null) => void;
  onLoopIn: () => void;
  onLoopOut: () => void;
  onClearLoop: () => void;
  onSeek: (seconds: number) => void;
  onRenameCue: (cueId: string, label: string) => void;
  onRenameHandled: () => void;
  onOpenExport: () => void;
  onScrollToCue: (seconds: number) => void;
  activeWorkflowPreset: WorkflowPresetId | null;
  lastAutosaveAt: number | null;
  onApplyWorkflowPreset: (presetId: WorkflowPresetId) => void;
  onApplySmartPrep: () => void;
}

export function SessionEditorWorkspace(props: SessionEditorWorkspaceProps) {
  const addBleepRegion = useAudioStore((state) => state.addBleepRegion);
  const removeBleepRegion = useAudioStore((state) => state.removeBleepRegion);
  const addTransitionCue = useAudioStore((state) => state.addTransitionCue);
  const removeTransitionCue = useAudioStore((state) => state.removeTransitionCue);
  const commitAcapellaSwap = useAudioStore((state) => state.commitAcapellaSwap);
  const clearAcapellaSwap = useAudioStore((state) => state.clearAcapellaSwap);

  return (
    <div className="flex flex-col gap-4">
      <EditorTabs activeTab={props.activeTab} onTabChange={props.onTabChange} />
      {props.activeTab === "prepare" ? (
        <PreparePanel
          session={props.session}
          currentTime={props.currentTime}
          activeHotkeySlot={props.activeHotkeySlot}
          snapDivision={props.snapDivision}
          loopRegion={props.session.regions.find((region) => region.type === "loop")}
          onSelectSlot={props.onSelectHotkeySlot}
          onSetCueAtPlayhead={(hotkey) => props.onSetCueAtHotkey(hotkey, props.currentTime)}
          onJumpToCue={(hotkey) => {
            const cue = props.session.cuePoints.find((candidate) => candidate.hotkey === hotkey);

            if (cue) {
              props.onSelectCue(cue.id);
              props.onSeek(cue.position);
              props.onScrollToCue(cue.position);
            }
          }}
          onClearCue={props.onClearCueAtHotkey}
          onSnapDivisionChange={props.onSnapDivisionChange}
          onLoopIn={props.onLoopIn}
          onLoopOut={props.onLoopOut}
          onClearLoop={props.onClearLoop}
          onManualBpm={(bpm) => props.onBpmChange(bpm)}
          onResetBpm={props.onResetBpm}
          onBeatOffsetChange={props.onBeatOffsetChange}
          activeWorkflowPreset={props.activeWorkflowPreset}
          lastAutosaveAt={props.lastAutosaveAt}
          onApplyWorkflowPreset={props.onApplyWorkflowPreset}
          onApplySmartPrep={props.onApplySmartPrep}
        />
      ) : null}
      {props.activeTab === "edit" ? (
        <>
          <ErrorBoundary fallbackTitle="Editor failed" fallbackMessage="Intro and outro controls could not render.">
            <IntroOutroPanel
              regions={props.session.regions}
              currentTime={props.currentTime}
              bpm={props.session.file.bpm}
              snapDivision={props.snapDivision}
              onBpmChange={props.onBpmChange}
              onSnapDivisionChange={props.onSnapDivisionChange}
              onSetBoundary={props.onSetBoundary}
              onClearRegion={props.onClearRegion}
              onExtendRegion={props.onExtendRegion}
              onTrimRegion={props.onTrimRegion}
            />
          </ErrorBoundary>
          {props.showBeatOffset ? (
            <ErrorBoundary fallbackTitle="Beat grid failed" fallbackMessage="Beat grid controls could not render.">
              <BeatOffsetControl
                currentTime={props.currentTime}
                bpm={props.session.file.bpm}
                autoBpm={props.session.autoBpm}
                beatOffset={props.session.file.beatOffset}
                bpmSource={props.session.bpmSource}
                onManualBpm={(bpm) => props.onBpmChange(bpm)}
                onResetBpm={props.onResetBpm}
                onBeatOffsetChange={props.onBeatOffsetChange}
              />
            </ErrorBoundary>
          ) : null}
          {props.showStems && Object.keys(props.stems).length > 0 ? (
            <ErrorBoundary fallbackTitle="Stem player failed" fallbackMessage="Stem playback controls could not render.">
              <StemPlayer
                stems={props.stems}
                currentTime={props.currentTime}
                durationSeconds={props.durationSeconds}
                isPlaying={props.isPlaying}
                onExportStems={props.onOpenExport}
                onMixToStereo={props.onOpenExport}
              />
            </ErrorBoundary>
          ) : null}
          <ErrorBoundary fallbackTitle="Cue panel failed" fallbackMessage="Cue point controls could not render.">
            <CuePointPanel
              cuePoints={props.session.cuePoints}
              activeCueId={props.activeCueId}
              renameCueId={props.renameCueId}
              currentTime={props.currentTime}
              onAddCue={props.onAddCue}
              onSelectCue={props.onSelectCue}
              onSeek={props.onSeek}
              onRenameCue={props.onRenameCue}
              onRenameHandled={props.onRenameHandled}
            />
          </ErrorBoundary>
        </>
      ) : null}
      {props.activeTab === "clean" ? (
        <RadioEditPanel
          session={props.session}
          currentTime={props.currentTime}
          onAddRegion={(start, end, mode: BleepMode) => addBleepRegion(start, end, mode)}
          onRemoveRegion={removeBleepRegion}
        />
      ) : null}
      {props.activeTab === "swap" ? (
        <AcapellaSwap
          session={props.session}
          stems={props.stems}
          onCommit={commitAcapellaSwap}
          onClear={clearAcapellaSwap}
        />
      ) : null}
      {props.activeTab === "transition" ? (
        <TransitionCuePanel
          session={props.session}
          currentTime={props.currentTime}
          onAddCue={addTransitionCue}
          onRemoveCue={removeTransitionCue}
        />
      ) : null}
      {props.activeTab === "history" ? <EditHistory /> : null}
    </div>
  );
}
