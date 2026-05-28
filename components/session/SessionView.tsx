"use client";

import { useCallback, useEffect, useState } from "react";

import { ExportPanel } from "@/components/export/ExportPanel";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SessionEditorWorkspace } from "@/components/session/SessionEditorWorkspace";
import { SessionHeader } from "@/components/session/SessionHeader";
import { SessionMetadataBar } from "@/components/session/SessionMetadataBar";
import { SessionToolbar } from "@/components/session/SessionToolbar";
import { WaveformDisplay } from "@/components/waveform/WaveformDisplay";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useRegionEditor } from "@/hooks/useRegionEditor";
import { useSessionAudioAnalysis } from "@/hooks/useSessionAudioAnalysis";
import { useSessionAutosave } from "@/hooks/useSessionAutosave";
import { useSessionShortcuts } from "@/hooks/useSessionShortcuts";
import { snapToBeat } from "@/lib/regions";
import { useAudioStore } from "@/store/audioStore";
import type { AudioSession, CuePoint, WaveformRegion } from "@/types/audio";
import type { StemType } from "@/types/stems";

interface SessionViewProps {
  session: AudioSession;
  onClearSession: () => void;
  onPlayheadChange: (position: number) => void;
}

export function SessionView({ session, onClearSession, onPlayheadChange }: SessionViewProps) {
  const { currentTime, duration, error, isLoaded, isPlaying, bind, pause, play, rawWaveSurfer, registerPlayheadSync, seek, setVolume } =
    useAudioEngine();
  const editorSettings = useAudioStore((state) => state.editorSettings);
  const updateRegions = useAudioStore((state) => state.updateRegions);
  const setSnapDivision = useAudioStore((state) => state.setSnapDivision);
  const setActiveRegion = useAudioStore((state) => state.setActiveRegion);
  const setActiveCue = useAudioStore((state) => state.setActiveCue);
  const addCuePoint = useAudioStore((state) => state.addCuePoint);
  const setCueAtHotkey = useAudioStore((state) => state.setCueAtHotkey);
  const clearCueAtHotkey = useAudioStore((state) => state.clearCueAtHotkey);
  const setActiveHotkeySlot = useAudioStore((state) => state.setActiveHotkeySlot);
  const removeCuePoint = useAudioStore((state) => state.removeCuePoint);
  const updateCuePoint = useAudioStore((state) => state.updateCuePoint);
  const setBpm = useAudioStore((state) => state.setBpm);
  const resetBpmOverride = useAudioStore((state) => state.resetBpmOverride);
  const setBeatOffset = useAudioStore((state) => state.setBeatOffset);
  const setBeatGridVisible = useAudioStore((state) => state.setBeatGridVisible);
  const setStemModel = useAudioStore((state) => state.setStemModel);
  const setActiveTab = useAudioStore((state) => state.setActiveTab);
  const applyWorkflowPreset = useAudioStore((state) => state.applyWorkflowPreset);
  const applySmartPrep = useAudioStore((state) => state.applySmartPrep);
  const [renameCueId, setRenameCueId] = useState<string | null>(null);
  const [showBeatOffset, setShowBeatOffset] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showStems, setShowStems] = useState(false);
  const [stems, setStems] = useState<Partial<Record<StemType, AudioBuffer>>>({});
  const totalDuration = duration || session.file.durationSeconds;
  const regionEditor = useRegionEditor({ session, snapDivision: editorSettings.snapDivision, updateRegions, setActiveRegion });
  const analysis = useSessionAudioAnalysis(session);
  useSessionAutosave();

  useEffect(() => {
    registerPlayheadSync(onPlayheadChange);

    return () => {
      registerPlayheadSync(null);
    };
  }, [onPlayheadChange, registerPlayheadSync]);

  const handleTransportSeek = useCallback(
    (seconds: number): void => {
      seek(seconds);
      onPlayheadChange(seconds);
    },
    [onPlayheadChange, seek],
  );

  const handleRegionChange = useCallback(
    (region: WaveformRegion): void => {
      const nextRegions = session.regions.some((candidate) => candidate.id === region.id)
        ? session.regions.map((candidate) => (candidate.id === region.id ? region : candidate))
        : [...session.regions, region];
      updateRegions(nextRegions);
    },
    [session.regions, updateRegions],
  );

  const handleCueMove = useCallback(
    (cuePoint: CuePoint): void => {
      const snapDivision = editorSettings.snapDivision;
      const snappedPosition =
        session.file.bpm && snapDivision
          ? snapToBeat(cuePoint.position, session.file.bpm, snapDivision)
          : cuePoint.position;

      updateCuePoint(cuePoint.id, { position: snappedPosition });
    },
    [editorSettings.snapDivision, session.file.bpm, updateCuePoint],
  );

  const handleCueSetAtHotkey = useCallback(
    (hotkey: number, position: number): void => {
      const snapDivision = editorSettings.snapDivision;
      const snappedPosition =
        session.file.bpm && snapDivision ? snapToBeat(position, session.file.bpm, snapDivision) : position;

      setActiveHotkeySlot(hotkey);
      setCueAtHotkey(hotkey, snappedPosition);
    },
    [editorSettings.snapDivision, session.file.bpm, setActiveHotkeySlot, setCueAtHotkey],
  );

  useSessionShortcuts({
    session,
    currentTime,
    totalDuration,
    isLoaded,
    isPlaying,
    play,
    pause,
    seek: handleTransportSeek,
    setIntroIn: () => regionEditor.setBoundary("intro", "start", currentTime),
    setIntroOut: () => regionEditor.setBoundary("intro", "end", currentTime),
    setOutroIn: () => regionEditor.setBoundary("outro", "start", currentTime),
    setOutroOut: () => regionEditor.setBoundary("outro", "end", currentTime),
    toggleLoop: regionEditor.toggleLoopSelection,
    setLoopIn: () => regionEditor.setLoopIn(currentTime),
    setLoopOut: () => regionEditor.setLoopOut(currentTime),
    setCueAtHotkey,
    scrollToTime: (seconds) => {
      rawWaveSurfer.current?.setScrollTime(seconds);
    },
    setActiveCue,
    setActiveRegion,
  });

  return (
    <section className="flex flex-col gap-5" aria-label="Loaded audio session">
      <SessionHeader session={session} totalDuration={totalDuration} onClearSession={onClearSession} />
      <SessionMetadataBar
        session={session}
        analysis={analysis}
        beatGridVisible={editorSettings.beatGridVisible}
        onManualBpm={(bpm) => setBpm(bpm, "manual")}
        onToggleBeatGrid={() => setBeatGridVisible(!editorSettings.beatGridVisible)}
        onToggleBeatOffset={() => setShowBeatOffset((isVisible) => !isVisible)}
      />

      {!isLoaded ? <LoadingSpinner label="Loading audio engine" /> : null}
      {error ? (
        <p className="rounded-dropzone border border-border bg-surface px-4 py-3 font-body text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}

      <ErrorBoundary fallbackTitle="Waveform failed" fallbackMessage="The waveform renderer could not load this track.">
        <WaveformDisplay
          audioUrl={session.file.url}
          bindPlaybackEngine={bind}
          currentTime={currentTime}
          duration={totalDuration}
          regions={session.regions}
          cuePoints={session.cuePoints}
          bleepRegions={session.bleepRegions}
          transitionCues={session.transitionCues}
          bpm={session.file.bpm}
          beatOffset={session.file.beatOffset}
          beatGridVisible={editorSettings.beatGridVisible}
          snapEnabled={editorSettings.snapDivision !== null}
          prepareMode={editorSettings.activeTab === "prepare"}
          activeHotkeySlot={editorSettings.activeHotkeySlot}
          isPlaying={isPlaying}
          onSeek={handleTransportSeek}
          onRegionChange={handleRegionChange}
          onRegionClick={setActiveRegion}
          onCueAdd={addCuePoint}
          onCueSetAtHotkey={handleCueSetAtHotkey}
          onCueSelect={setActiveCue}
          onCueMove={handleCueMove}
          onCueDelete={removeCuePoint}
          onCueRenameRequest={setRenameCueId}
        />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Toolbar failed" fallbackMessage="Playback and export controls could not render.">
        <SessionToolbar
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={totalDuration}
          file={session.file.sourceFile}
          stemModel={editorSettings.stemModel}
          hasStems={Object.keys(stems).length > 0}
          onPlay={play}
          onPause={pause}
          onSeek={handleTransportSeek}
          onVolumeChange={setVolume}
          onStemModelChange={setStemModel}
          onStemsComplete={(nextStems) => {
            setStems(nextStems);
            setShowStems(true);
          }}
          onOpenStems={() => setShowStems(true)}
          onOpenExport={() => setShowExport((isVisible) => !isVisible)}
        />
      </ErrorBoundary>
      {showExport ? (
        <ErrorBoundary fallbackTitle="Export failed" fallbackMessage="Export controls could not render.">
          <ExportPanel session={session} stems={stems} onClose={() => setShowExport(false)} />
        </ErrorBoundary>
      ) : null}
      <SessionEditorWorkspace
        session={session}
        currentTime={currentTime}
        durationSeconds={totalDuration}
        isPlaying={isPlaying}
        snapDivision={editorSettings.snapDivision}
        activeTab={editorSettings.activeTab}
        onTabChange={setActiveTab}
        activeCueId={editorSettings.activeCueId}
        activeHotkeySlot={editorSettings.activeHotkeySlot}
        renameCueId={renameCueId}
        showBeatOffset={showBeatOffset}
        showStems={showStems}
        stems={stems}
        onBpmChange={(bpm) => (bpm === null ? resetBpmOverride() : setBpm(bpm, "manual"))}
        onSnapDivisionChange={setSnapDivision}
        onSetBoundary={regionEditor.setBoundary}
        onClearRegion={regionEditor.clearRegion}
        onExtendRegion={regionEditor.extendRegion}
        onTrimRegion={regionEditor.trimRegion}
        onBeatOffsetChange={setBeatOffset}
        onResetBpm={resetBpmOverride}
        onAddCue={addCuePoint}
        onSetCueAtHotkey={handleCueSetAtHotkey}
        onClearCueAtHotkey={clearCueAtHotkey}
        onSelectHotkeySlot={setActiveHotkeySlot}
        onLoopIn={() => regionEditor.setLoopIn(currentTime)}
        onLoopOut={() => regionEditor.setLoopOut(currentTime)}
        onClearLoop={() => regionEditor.clearRegion("loop")}
        onSelectCue={setActiveCue}
        onSeek={handleTransportSeek}
        onRenameCue={(cueId, label) => updateCuePoint(cueId, { label })}
        onRenameHandled={() => setRenameCueId(null)}
        onOpenExport={() => setShowExport(true)}
        onScrollToCue={(seconds) => {
          rawWaveSurfer.current?.setScrollTime(Math.max(seconds - 1, 0));
        }}
        activeWorkflowPreset={editorSettings.activeWorkflowPreset}
        lastAutosaveAt={editorSettings.lastAutosaveAt}
        onApplyWorkflowPreset={applyWorkflowPreset}
        onApplySmartPrep={applySmartPrep}
      />
    </section>
  );
}
