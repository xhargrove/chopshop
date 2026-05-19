"use client";

import { useEffect, useRef } from "react";

import { getBeatsInRange } from "@/lib/beatGrid";
import { MIN_BEAT_GRID_SPACING_PX, WAVEFORM_HEIGHT } from "@/lib/constants";
import { drawBeatGridCanvas, prepareCanvas } from "@/lib/waveformCanvas";

interface BeatGridLayerProps {
  bpm: number;
  beatOffset: number;
  durationSeconds: number;
  containerWidthPx: number;
  scrollOffsetSeconds: number;
  secondsPerPixel: number;
  visible: boolean;
}

export function BeatGridLayer({
  bpm,
  beatOffset,
  durationSeconds,
  containerWidthPx,
  scrollOffsetSeconds,
  secondsPerPixel,
  visible,
}: BeatGridLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;

      if (!canvas || !visible || containerWidthPx <= 0 || secondsPerPixel <= 0) {
        return;
      }

      const beatSpacingPx = 60 / bpm / secondsPerPixel;
      const visibleStart = scrollOffsetSeconds;
      const visibleEnd = Math.min(durationSeconds, scrollOffsetSeconds + containerWidthPx * secondsPerPixel);
      const beatPositions = beatSpacingPx >= MIN_BEAT_GRID_SPACING_PX ? getBeatsInRange(visibleStart, visibleEnd, bpm, beatOffset) : [];
      const context = prepareCanvas(canvas, containerWidthPx, WAVEFORM_HEIGHT);

      if (context) {
        drawBeatGridCanvas(context, beatPositions, bpm, beatOffset, scrollOffsetSeconds, secondsPerPixel, WAVEFORM_HEIGHT);
      }
    });

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [beatOffset, bpm, containerWidthPx, durationSeconds, scrollOffsetSeconds, secondsPerPixel, visible]);

  if (!visible) {
    return null;
  }

  return <canvas ref={canvasRef} className="absolute inset-0 z-[5] h-full w-full" aria-hidden="true" />;
}
