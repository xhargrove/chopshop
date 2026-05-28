"use client";

import WaveSurfer from "wavesurfer.js";
import { useEffect, useRef, useState } from "react";

import { WaveformOverlays } from "@/components/waveform/WaveformOverlays";
import { WaveformOverview } from "@/components/waveform/WaveformOverview";
import { WaveformZoomControls } from "@/components/waveform/WaveformZoomControls";
import {
  DESIGN_COLORS,
  WAVEFORM_CURSOR_WIDTH,
  WAVEFORM_HEIGHT,
  WAVEFORM_MIN_PX_PER_SECOND,
} from "@/lib/constants";
import { formatTime } from "@/lib/format";
import { useWaveformViewport } from "@/hooks/useWaveformViewport";
import type { WaveformDisplayProps } from "@/types/waveform";

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function WaveformDisplay({
  audioUrl,
  currentTime,
  duration,
  regions,
  cuePoints,
  bleepRegions,
  transitionCues,
  bpm,
  beatOffset,
  beatGridVisible,
  snapEnabled,
  prepareMode,
  activeHotkeySlot,
  isPlaying,
  bindPlaybackEngine,
  onSeek,
  onRegionChange,
  onRegionClick,
  onCueAdd,
  onCueSetAtHotkey,
  onCueSelect,
  onCueMove,
  onCueDelete,
  onCueRenameRequest,
}: WaveformDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const bindPlaybackEngineRef = useRef(bindPlaybackEngine);
  const durationRef = useRef(duration);
  const hasFittedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidthPx, setContainerWidthPx] = useState(0);

  const {
    waveformFrameRef,
    scrollOffsetSeconds,
    secondsPerPixel,
    visibleDurationSeconds,
    zoomIn,
    zoomOut,
    zoomFit,
    scrollToTime,
  } = useWaveformViewport(wavesurferRef, {
    durationSeconds: duration,
    containerWidthPx,
    isReady,
    followPlayback: isPlaying,
  });

  useEffect(() => {
    bindPlaybackEngineRef.current = bindPlaybackEngine;
  }, [bindPlaybackEngine]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    hasFittedRef.current = false;
  }, [audioUrl]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    setIsReady(false);
    setError(null);

    const wavesurfer = WaveSurfer.create({
      container,
      url: audioUrl,
      waveColor: DESIGN_COLORS.border,
      progressColor: DESIGN_COLORS.accent,
      cursorColor: DESIGN_COLORS.accent,
      cursorWidth: WAVEFORM_CURSOR_WIDTH,
      height: WAVEFORM_HEIGHT,
      normalize: true,
      backend: "WebAudio",
      interact: true,
      fillParent: true,
      minPxPerSec: WAVEFORM_MIN_PX_PER_SECOND,
      hideScrollbar: false,
      autoScroll: false,
      autoCenter: false,
      dragToSeek: true,
    });

    wavesurferRef.current = wavesurfer;
    const unbindPlayback = bindPlaybackEngineRef.current?.(wavesurfer);

    const unsubscribeReady = wavesurfer.on("ready", (readyDuration: number) => {
      durationRef.current = readyDuration;
      setIsReady(true);

      if (!hasFittedRef.current) {
        hasFittedRef.current = true;
        zoomFit();
      }
    });

    const unsubscribeError = wavesurfer.on("error", (waveformError: unknown) => {
      setError(getErrorMessage(waveformError));
      setIsReady(false);
    });

    return () => {
      unsubscribeReady();
      unsubscribeError();
      unbindPlayback?.();
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [audioUrl]);

  useEffect(() => {
    const frame = waveformFrameRef.current;

    if (!frame) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerWidthPx(entry.contentRect.width);
    });

    resizeObserver.observe(frame);

    return () => {
      resizeObserver.disconnect();
    };
  }, [waveformFrameRef]);

  const handleOverviewNavigate = (seconds: number): void => {
    onSeek(seconds);
    scrollToTime(Math.max(0, seconds - visibleDurationSeconds / 2));
  };

  return (
    <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Audio waveform">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 font-mono text-sm text-text-muted">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>
        <WaveformZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onZoomFit={zoomFit} />
      </div>
      <div
        ref={waveformFrameRef}
        className="relative overflow-x-auto overflow-y-hidden rounded-dropzone border border-border bg-background"
      >
        {!isReady ? <div className="absolute inset-0 z-10 animate-pulse bg-surface" aria-hidden="true" /> : null}
        <div ref={containerRef} className="min-h-[theme(spacing.32)] min-w-full" />
        {secondsPerPixel > 0 ? (
          <WaveformOverlays
            duration={duration}
            containerWidthPx={containerWidthPx}
            secondsPerPixel={secondsPerPixel}
            scrollOffsetSeconds={scrollOffsetSeconds}
            regions={regions}
            cuePoints={cuePoints}
            bleepRegions={bleepRegions}
            transitionCues={transitionCues}
            bpm={bpm}
            beatOffset={beatOffset}
            beatGridVisible={beatGridVisible}
            snapEnabled={snapEnabled}
            prepareMode={prepareMode}
            activeHotkeySlot={activeHotkeySlot}
            onRegionChange={onRegionChange}
            onRegionClick={onRegionClick}
            onCueAdd={onCueAdd}
            onCueSetAtHotkey={onCueSetAtHotkey}
            onCueSelect={onCueSelect}
            onCueMove={onCueMove}
            onCueDelete={onCueDelete}
            onCueRenameRequest={onCueRenameRequest}
          />
        ) : null}
      </div>
      {isReady ? (
        <WaveformOverview
          durationSeconds={duration}
          currentTime={currentTime}
          scrollOffsetSeconds={scrollOffsetSeconds}
          visibleDurationSeconds={visibleDurationSeconds}
          onNavigate={handleOverviewNavigate}
        />
      ) : null}
      {error ? (
        <p className="mt-3 rounded-dropzone border border-border bg-background px-3 py-2 font-body text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
