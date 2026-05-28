"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type WaveSurfer from "wavesurfer.js";

import { WAVEFORM_MIN_PX_PER_SECOND } from "@/lib/constants";
import { clampPixelsPerSecond, getFitPixelsPerSecond, getNextZoom } from "@/lib/waveformViewport";

interface UseWaveformViewportOptions {
  durationSeconds: number;
  containerWidthPx: number;
  isReady: boolean;
  followPlayback: boolean;
}

interface WaveformViewport {
  waveformFrameRef: RefObject<HTMLDivElement>;
  scrollOffsetSeconds: number;
  pixelsPerSecond: number;
  secondsPerPixel: number;
  visibleDurationSeconds: number;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
  scrollToTime: (seconds: number) => void;
}

export function useWaveformViewport(
  wavesurferRef: RefObject<WaveSurfer | null>,
  { durationSeconds, containerWidthPx, isReady, followPlayback }: UseWaveformViewportOptions,
): WaveformViewport {
  const pixelsPerSecondRef = useRef(WAVEFORM_MIN_PX_PER_SECOND);
  const [scrollOffsetSeconds, setScrollOffsetSeconds] = useState(0);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(WAVEFORM_MIN_PX_PER_SECOND);

  const applyZoom = useCallback(
    (nextPixelsPerSecond: number): void => {
      const wavesurfer = wavesurferRef.current;

      if (!wavesurfer || durationSeconds <= 0) {
        return;
      }

      const viewportWidthPx = containerWidthPx > 0 ? containerWidthPx : wavesurfer.getWidth();
      const fitPixelsPerSecond = getFitPixelsPerSecond(viewportWidthPx, durationSeconds);
      const clamped = clampPixelsPerSecond(nextPixelsPerSecond);
      pixelsPerSecondRef.current = clamped;

      wavesurfer.setOptions({
        fillParent: clamped <= fitPixelsPerSecond + 0.5,
        minPxPerSec: clamped,
        autoScroll: followPlayback,
      });
      wavesurfer.zoom(clamped);
      setPixelsPerSecond(clamped);
    },
    [containerWidthPx, durationSeconds, followPlayback, wavesurferRef],
  );

  const zoomFit = useCallback((): void => {
    const wavesurfer = wavesurferRef.current;
    const viewportWidthPx = containerWidthPx > 0 ? containerWidthPx : (wavesurfer?.getWidth() ?? 0);
    applyZoom(getFitPixelsPerSecond(viewportWidthPx, durationSeconds));
  }, [applyZoom, containerWidthPx, durationSeconds, wavesurferRef]);

  const zoomIn = useCallback((): void => {
    applyZoom(getNextZoom(pixelsPerSecondRef.current, 1));
  }, [applyZoom]);

  const zoomOut = useCallback((): void => {
    applyZoom(getNextZoom(pixelsPerSecondRef.current, -1));
  }, [applyZoom]);

  const scrollToTime = useCallback(
    (seconds: number): void => {
      wavesurferRef.current?.setScrollTime(seconds);
    },
    [wavesurferRef],
  );

  useEffect(() => {
    const wavesurfer = wavesurferRef.current;

    if (!wavesurfer || !isReady) {
      return;
    }

    const offScroll = wavesurfer.on("scroll", (visibleStartTime) => {
      setScrollOffsetSeconds(visibleStartTime);
    });

    const offZoom = wavesurfer.on("zoom", (minPxPerSec) => {
      pixelsPerSecondRef.current = minPxPerSec;
      setPixelsPerSecond(minPxPerSec);
    });

    return () => {
      offScroll();
      offZoom();
    };
  }, [isReady, wavesurferRef]);

  useEffect(() => {
    const wavesurfer = wavesurferRef.current;

    if (!wavesurfer || !isReady) {
      return;
    }

    wavesurfer.setOptions({ autoScroll: followPlayback });
  }, [followPlayback, isReady, wavesurferRef]);

  const waveformFrameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = waveformFrameRef.current;

    if (!frame) {
      return;
    }

    const handleWheel = (event: WheelEvent): void => {
      const wavesurfer = wavesurferRef.current;

      if (!wavesurfer) {
        return;
      }

      event.preventDefault();

      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        const direction = event.deltaY < 0 ? 1 : -1;
        applyZoom(getNextZoom(pixelsPerSecondRef.current, direction));
        return;
      }

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      wavesurfer.setScroll(wavesurfer.getScroll() + delta);
    };

    frame.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      frame.removeEventListener("wheel", handleWheel);
    };
  }, [applyZoom, wavesurferRef]);

  const secondsPerPixel = pixelsPerSecond > 0 ? 1 / pixelsPerSecond : 0;
  const visibleDurationSeconds = containerWidthPx > 0 && pixelsPerSecond > 0 ? containerWidthPx / pixelsPerSecond : 0;

  return {
    waveformFrameRef,
    scrollOffsetSeconds,
    pixelsPerSecond,
    secondsPerPixel,
    visibleDurationSeconds,
    zoomIn,
    zoomOut,
    zoomFit,
    scrollToTime,
  };
}
