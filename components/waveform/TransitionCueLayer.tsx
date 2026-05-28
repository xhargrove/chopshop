"use client";

import { useCallback, useEffect, useRef } from "react";

import { WAVEFORM_HEIGHT } from "@/lib/constants";
import { drawTransitionCueCanvas, prepareCanvas } from "@/lib/waveformCanvas";
import type { TransitionCue } from "@/types/audio";

interface TransitionCueLayerProps {
  cues: TransitionCue[];
  containerWidthPx: number;
  scrollOffsetSeconds: number;
  secondsPerPixel: number;
}

export function TransitionCueLayer({ cues, containerWidthPx, scrollOffsetSeconds, secondsPerPixel }: TransitionCueLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const draw = useCallback((): void => {
    const canvas = canvasRef.current;

    if (!canvas || containerWidthPx <= 0 || secondsPerPixel <= 0) {
      return;
    }

    const context = prepareCanvas(canvas, containerWidthPx, WAVEFORM_HEIGHT);

    if (!context) {
      return;
    }

    drawTransitionCueCanvas(context, cues, containerWidthPx, WAVEFORM_HEIGHT, scrollOffsetSeconds, secondsPerPixel);
  }, [containerWidthPx, cues, scrollOffsetSeconds, secondsPerPixel]);

  useEffect(() => {
    draw();
  }, [draw]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-30 h-full w-full" aria-hidden />;
}
