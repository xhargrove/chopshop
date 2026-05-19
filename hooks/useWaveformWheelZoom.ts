"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import type WaveSurfer from "wavesurfer.js";

import { WAVEFORM_MAX_PX_PER_SECOND, WAVEFORM_MIN_PX_PER_SECOND, WAVEFORM_SCROLL_ZOOM_STEP } from "@/lib/constants";

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);

export function useWaveformWheelZoom(wavesurferRef: RefObject<WaveSurfer | null>, zoomRef: MutableRefObject<number>) {
  const waveformFrameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const waveformFrame = waveformFrameRef.current;

    if (!waveformFrame) {
      return;
    }

    const handleWheel = (event: globalThis.WheelEvent): void => {
      const wavesurfer = wavesurferRef.current;

      if (!wavesurfer) {
        return;
      }

      event.preventDefault();
      const direction = event.deltaY < 0 ? WAVEFORM_SCROLL_ZOOM_STEP : -WAVEFORM_SCROLL_ZOOM_STEP;
      const nextZoom = clamp(zoomRef.current + direction, WAVEFORM_MIN_PX_PER_SECOND, WAVEFORM_MAX_PX_PER_SECOND);
      zoomRef.current = nextZoom;
      wavesurfer.zoom(nextZoom);
    };

    waveformFrame.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      waveformFrame.removeEventListener("wheel", handleWheel);
    };
  }, [wavesurferRef, zoomRef]);

  return waveformFrameRef;
}
