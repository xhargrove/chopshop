import {
  AUDIO_START_SECONDS,
  AUDIO_TIME_DECIMALS,
  DEFAULT_BEATS_PER_BAR,
  REGION_COLORS,
  REGION_LABELS,
  SECONDS_PER_MINUTE,
} from "@/lib/constants";
import type { WaveformRegion } from "@/types/audio";

type SnapDivision = 1 | 2 | 4;

const roundSeconds = (seconds: number): number => Number(seconds.toFixed(AUDIO_TIME_DECIMALS));

const clampTime = (seconds: number, durationSeconds: number): number => roundSeconds(Math.min(Math.max(seconds, AUDIO_START_SECONDS), durationSeconds));

const getBeatDuration = (bpm: number, snapDivision: number): number => SECONDS_PER_MINUTE / bpm / snapDivision;

const normalizeBounds = (start: number, end: number): { start: number; end: number } => ({
  start: Math.min(start, end),
  end: Math.max(start, end),
});

/**
 * Creates a deterministic waveform region with the default label and color for its type.
 */
export function createRegion(type: WaveformRegion["type"], start: number, end: number, durationSeconds: number): WaveformRegion {
  const clamped = clampRegion(
    {
      id: `${type}-${roundSeconds(start)}-${roundSeconds(end)}`,
      start,
      end,
      type,
      color: REGION_COLORS[type].border,
      label: REGION_LABELS[type],
    },
    durationSeconds,
  );

  return {
    ...clamped,
    id: `${type}-${clamped.start}-${clamped.end}`,
  };
}

/**
 * Returns a new region with ordered bounds constrained to the audio duration.
 */
export function clampRegion(region: WaveformRegion, durationSeconds: number): WaveformRegion {
  const bounds = normalizeBounds(region.start, region.end);

  return {
    ...region,
    start: clampTime(bounds.start, durationSeconds),
    end: clampTime(bounds.end, durationSeconds),
  };
}

/**
 * Snaps a time value to the nearest beat subdivision for the supplied BPM.
 */
export function snapToBeat(timeSeconds: number, bpm: number, snapDivision: SnapDivision): number {
  const beatDuration = getBeatDuration(bpm, snapDivision);

  return roundSeconds(Math.round(timeSeconds / beatDuration) * beatDuration);
}

/**
 * Determines whether two half-open region ranges share any time.
 */
export function regionsOverlap(a: WaveformRegion, b: WaveformRegion): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Extends a region boundary by a number of beats while keeping the opposite boundary fixed.
 */
export function extendByBeats(region: WaveformRegion, beats: number, bpm: number, direction: "start" | "end"): WaveformRegion {
  const deltaSeconds = (SECONDS_PER_MINUTE / bpm) * beats;

  if (direction === "start") {
    return {
      ...region,
      start: roundSeconds(region.start - deltaSeconds),
    };
  }

  return {
    ...region,
    end: roundSeconds(region.end + deltaSeconds),
  };
}

/**
 * Trims a region to an exact bar count from either the start or end anchor.
 */
export function trimToNBars(
  region: WaveformRegion,
  bars: number,
  bpm: number,
  beatsPerBar: number = DEFAULT_BEATS_PER_BAR,
  anchor: "start" | "end",
): WaveformRegion {
  const durationSeconds = (SECONDS_PER_MINUTE / bpm) * beatsPerBar * bars;

  if (anchor === "start") {
    return {
      ...region,
      end: roundSeconds(region.start + durationSeconds),
    };
  }

  return {
    ...region,
    start: roundSeconds(region.end - durationSeconds),
  };
}
