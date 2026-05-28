import { WAVEFORM_MAX_PX_PER_SECOND, WAVEFORM_MIN_PX_PER_SECOND, WAVEFORM_SCROLL_ZOOM_STEP } from "@/lib/constants";

export const clampPixelsPerSecond = (value: number): number =>
  Math.min(Math.max(value, WAVEFORM_MIN_PX_PER_SECOND), WAVEFORM_MAX_PX_PER_SECOND);

/** Pixels per second so the full track fits the visible viewport width (may be below zoom min). */
export const getFitPixelsPerSecond = (containerWidthPx: number, durationSeconds: number): number => {
  if (containerWidthPx <= 0 || durationSeconds <= 0) {
    return WAVEFORM_MIN_PX_PER_SECOND;
  }

  const fitLevel = containerWidthPx / durationSeconds;
  return Math.min(Math.max(fitLevel, 1), WAVEFORM_MAX_PX_PER_SECOND);
};

export const getVisibleDurationSeconds = (containerWidthPx: number, pixelsPerSecond: number): number =>
  pixelsPerSecond > 0 ? containerWidthPx / pixelsPerSecond : 0;

export const getNextZoom = (currentPixelsPerSecond: number, direction: 1 | -1): number =>
  clampPixelsPerSecond(currentPixelsPerSecond + direction * WAVEFORM_SCROLL_ZOOM_STEP);
