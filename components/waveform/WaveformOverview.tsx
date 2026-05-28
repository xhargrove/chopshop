"use client";

import { useCallback, type PointerEvent } from "react";

import { formatTime } from "@/lib/format";

interface WaveformOverviewProps {
  durationSeconds: number;
  currentTime: number;
  scrollOffsetSeconds: number;
  visibleDurationSeconds: number;
  onNavigate: (seconds: number) => void;
}

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);

export function WaveformOverview({
  durationSeconds,
  currentTime,
  scrollOffsetSeconds,
  visibleDurationSeconds,
  onNavigate,
}: WaveformOverviewProps) {
  const handlePointer = useCallback(
    (event: PointerEvent<HTMLDivElement>): void => {
      if (durationSeconds <= 0) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      onNavigate(ratio * durationSeconds);
    },
    [durationSeconds, onNavigate],
  );

  if (durationSeconds <= 0) {
    return null;
  }

  const playheadPercent = (currentTime / durationSeconds) * 100;
  const viewportStartPercent = (scrollOffsetSeconds / durationSeconds) * 100;
  const viewportWidthPercent = Math.min((visibleDurationSeconds / durationSeconds) * 100, 100 - viewportStartPercent);

  return (
    <div className="mt-3" aria-label="Track overview">
      <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        <span>Overview</span>
        <span>
          {formatTime(scrollOffsetSeconds)} – {formatTime(Math.min(scrollOffsetSeconds + visibleDurationSeconds, durationSeconds))}
        </span>
      </div>
      <div
        className="relative h-6 cursor-pointer rounded border border-border bg-background"
        role="slider"
        aria-label="Scroll through track"
        aria-valuemin={0}
        aria-valuemax={durationSeconds}
        aria-valuenow={scrollOffsetSeconds}
        onPointerDown={handlePointer}
        onPointerMove={(event) => {
          if (event.buttons > 0) {
            handlePointer(event);
          }
        }}
      >
        <div
          className="absolute inset-y-0 rounded-sm border border-accent/40 bg-accent/10"
          style={{ left: `${viewportStartPercent}%`, width: `${viewportWidthPercent}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-accent"
          style={{ left: `${playheadPercent}%` }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-1 font-mono text-[10px] text-text-muted">Scroll or drag overview · Shift+wheel to zoom</p>
    </div>
  );
}
