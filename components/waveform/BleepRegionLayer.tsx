"use client";

import { useCallback, useRef } from "react";

import { useCanvasLayer } from "@/hooks/useCanvasLayer";

import { WAVEFORM_HEIGHT } from "@/lib/constants";
import { drawBleepRegionCanvas, prepareCanvas } from "@/lib/waveformCanvas";
import type { BleepRegion } from "@/types/audio";

interface BleepRegionLayerProps {
  regions: BleepRegion[];
  containerWidthPx: number;
  scrollOffsetSeconds: number;
  secondsPerPixel: number;
}

export function BleepRegionLayer({ regions, containerWidthPx, scrollOffsetSeconds, secondsPerPixel }: BleepRegionLayerProps) {
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

    drawBleepRegionCanvas(context, regions, containerWidthPx, WAVEFORM_HEIGHT, scrollOffsetSeconds, secondsPerPixel);
  }, [containerWidthPx, regions, scrollOffsetSeconds, secondsPerPixel]);

  useCanvasLayer(draw, [draw]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-20 h-full w-full" aria-hidden />;
}
