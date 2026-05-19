"use client";

import { useCallback, useEffect, useState } from "react";

import { ExportPanel } from "@/components/export/ExportPanel";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SessionEditorPanels } from "@/components/session/SessionEditorPanels";
import { SessionHeader } from "@/components/session/SessionHeader";
import { SessionMetadataBar } from "@/components/session/SessionMetadataBar";
import { SessionToolbar } from "@/components/session/SessionToolbar";
import { WaveformDisplay } from "@/components/waveform/WaveformDisplay";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useRegionEditor } from "@/hooks/useRegionEditor";
import { useSessionAudioAnalysis } from "@/hooks/useSessionAudioAnalysis";
import { useSessionShortcuts } from "@/hooks/useSessionShortcuts";
import { useAudioStore } from "@/store/audioStore";
import type { AudioSession, CuePoint, WaveformRegion } from "@/types/audio";
import type { StemType } from "@/types/stems";

interface SessionViewProps {
  session: AudioSession;
  onClearSession: () => void;
  onPlayheadChange: (position: number) => void;
}

export function SessionView({ session, onClearSession, onPlayheadChange }: SessionViewProps) {
  const { currentTime, duration, error, isLoaded, isPlaying, load, pause, play, seek, setVolume } = useAudioEngine();
  // PHASE 2 CHANGE: SessionView now coordinates editor store actions with the Phase 1 playback engine.
  const editorSettings = useAudioStore((state) => state.editorSettings);
  const updateRegions = useAudioStore((state) => state.updateRegions);
  const setSnapDivision = useAudioStore((state) => state.setSnapDivision);
  const setActiveRegion = useAudioStore((state) => state.setActiveRegion);
  const setActiveCue = useAudioStore((state) => state.setActiveCue);
  const addCuePoint = useAudioStore((state) => state.addCuePoint);
  const removeCuePoint = useAudioStore((state) => state.removeCuePoint);
  const updateCuePoint = useAudioStore((state) => state.updateCuePoint);
  const setBpm = useAudioStore((state) => state.setBpm);
  const resetBpmOverride = useAudioStore((state) => state.resetBpmOverride);
  const setBeatOffset = useAudioStore((state) => state.setBeatOffset);
  const setBeatGridVisible = useAudioStore((state) => state.setBeatGridVisible);
  const setStemModel = useAudioStore((state) => state.setStemModel);
  const [renameCueId, setRenameCueId] = useState<string | null>(null);
  const [showBeatOffset, setShowBeatOffset] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showStems, setShowStems] = useState(false);
  const [stems, setStems] = useState<Partial<Record<StemType, AudioBuffer>>>({});
  const totalDuration = duration || session.file.durationSeconds;
  const regionEditor = useRegionEditor({ session, snapDivision: editorSettings.snapDivision, updateRegions, setActiveRegion });
  const analysis = useSessionAudioAnalysis(session);

  useEffect(() => {
    void load(session.file.url, session.file.format);
  }, [load, session.file.format, session.file.url]);

  useEffect(() => {
    onPlayheadChange(currentTime);
  }, [currentTime, onPlayheadChange]);

  const handleSeek = useCallback(
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
      updateCuePoint(cuePoint.id, { position: cuePoint.position });
    },
    [updateCuePoint],
  );

  useSessionShortcuts({
    session,
    currentTime,
    totalDuration,
    isLoaded,
    isPlaying,
    play,
    pause,
    seek: handleSeek,
    setIntroIn: () => regionEditor.setBoundary("intro", "start", currentTime),
    setIntroOut: () => regionEditor.setBoundary("intro", "end", currentTime),
    setOutroIn: () => regionEditor.setBoundary("outro", "start", currentTime),
    setOutroOut: () => regionEditor.setBoundary("outro", "end", currentTime),
    toggleLoop: regionEditor.toggleLoopSelection,
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
          currentTime={currentTime}
          duration={totalDuration}
          regions={session.regions}
          cuePoints={session.cuePoints}
          bpm={session.file.bpm}
          beatOffset={session.file.beatOffset}
          beatGridVisible={editorSettings.beatGridVisible}
          snapEnabled={editorSettings.snapDivision !== null}
          onSeek={handleSeek}
          onRegionChange={handleRegionChange}
          onRegionClick={setActiveRegion}
          onCueAdd={addCuePoint}
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
          onSeek={handleSeek}
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
      <SessionEditorPanels
        session={session}
        currentTime={currentTime}
        snapDivision={editorSettings.snapDivision}
        activeCueId={editorSettings.activeCueId}
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
        onSelectCue={setActiveCue}
        onSeek={handleSeek}
        onRenameCue={(cueId, label) => updateCuePoint(cueId, { label })}
        onRenameHandled={() => setRenameCueId(null)}
        onOpenExport={() => setShowExport(true)}
      />
    </section>
  );
}
