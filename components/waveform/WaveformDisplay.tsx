"use client";

import WaveSurfer from "wavesurfer.js";
import { useEffect, useRef, useState } from "react";

import { WaveformOverlays } from "@/components/waveform/WaveformOverlays";
import {
  DESIGN_COLORS,
  WAVEFORM_CURSOR_WIDTH,
  WAVEFORM_HEIGHT,
  WAVEFORM_MIN_PX_PER_SECOND,
  WAVEFORM_SYNC_TOLERANCE_SECONDS,
} from "@/lib/constants";
import { formatTime } from "@/lib/format";
import { useWaveformWheelZoom } from "@/hooks/useWaveformWheelZoom";
import type { WaveformDisplayProps } from "@/types/waveform";

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function WaveformDisplay({
  audioUrl,
  currentTime,
  duration,
  regions,
  cuePoints,
  bpm,
  beatOffset,
  beatGridVisible,
  snapEnabled,
  onSeek,
  onRegionChange,
  onRegionClick,
  onCueAdd,
  onCueSelect,
  onCueMove,
  onCueDelete,
  onCueRenameRequest,
}: WaveformDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  const zoomRef = useRef(WAVEFORM_MIN_PX_PER_SECOND);
  const [isReady, setIsReady] = useState(false);
  const [displayTime, setDisplayTime] = useState(currentTime);
  const [error, setError] = useState<string | null>(null);
  const [containerWidthPx, setContainerWidthPx] = useState(0);
  const waveformFrameRef = useWaveformWheelZoom(wavesurferRef, zoomRef);

  useEffect(() => {
    currentTimeRef.current = currentTime;
    durationRef.current = duration;
  }, [currentTime, duration]);

  useEffect(() => {
    const wavesurfer = wavesurferRef.current;

    if (!wavesurfer || !isReady) {
      return;
    }

    if (Math.abs(displayTime - currentTime) <= WAVEFORM_SYNC_TOLERANCE_SECONDS) {
      return;
    }

    wavesurfer.setTime(currentTime);
    setDisplayTime(currentTime);
  }, [currentTime, displayTime, isReady]);

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
    });

    wavesurferRef.current = wavesurfer;

    const unsubscribeReady = wavesurfer.on("ready", (readyDuration: number) => {
      durationRef.current = readyDuration;
      setDisplayTime(currentTimeRef.current);
      setIsReady(true);
    });

    const unsubscribeError = wavesurfer.on("error", (waveformError: unknown) => {
      setError(getErrorMessage(waveformError));
      setIsReady(false);
    });

    const unsubscribeAudioProcess = wavesurfer.on("audioprocess", (processTime: number) => {
      setDisplayTime(processTime);
    });

    const unsubscribeSeek = wavesurfer.on("seeking", (nextTime: number) => {
      setDisplayTime(nextTime);
      onSeek(nextTime);
    });

    return () => {
      unsubscribeReady();
      unsubscribeError();
      unsubscribeAudioProcess();
      unsubscribeSeek();
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [audioUrl, onSeek, containerRef.current]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerWidthPx(entry.contentRect.width);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef.current]);

  const secondsPerPixel = duration > 0 && containerWidthPx > 0 ? duration / containerWidthPx : 0;

  return (
    <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Audio waveform">
      <div className="mb-3 flex items-center justify-between font-mono text-sm text-text-muted">
        <span>{formatTime(displayTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div ref={waveformFrameRef} className="relative overflow-hidden rounded-dropzone border border-border bg-background">
        {!isReady ? <div className="absolute inset-0 z-10 animate-pulse bg-surface" aria-hidden="true" /> : null}
        {/* PHASE 2 CHANGE: Canvas overlays sit above WaveSurfer so region and cue edits stay synchronized with playback. */}
        <div ref={containerRef} className="min-h-[theme(spacing.32)]" />
        <WaveformOverlays
          duration={duration}
          containerWidthPx={containerWidthPx}
          secondsPerPixel={secondsPerPixel}
          regions={regions}
          cuePoints={cuePoints}
          bpm={bpm}
          beatOffset={beatOffset}
          beatGridVisible={beatGridVisible}
          snapEnabled={snapEnabled}
          onRegionChange={onRegionChange}
          onRegionClick={onRegionClick}
          onCueAdd={onCueAdd}
          onCueSelect={onCueSelect}
          onCueMove={onCueMove}
          onCueDelete={onCueDelete}
          onCueRenameRequest={onCueRenameRequest}
        />
      </div>
      {error ? (
        <p className="mt-3 rounded-dropzone border border-border bg-background px-3 py-2 font-body text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
