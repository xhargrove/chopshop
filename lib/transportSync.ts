import { WAVEFORM_SYNC_TOLERANCE_SECONDS } from "@/lib/constants";

export const TRANSPORT_SYNC_TOLERANCE_SECONDS = WAVEFORM_SYNC_TOLERANCE_SECONDS;

export const hasTransportDrift = (expectedSeconds: number, actualSeconds: number, toleranceSeconds = TRANSPORT_SYNC_TOLERANCE_SECONDS): boolean =>
  Math.abs(expectedSeconds - actualSeconds) > toleranceSeconds;

export const clampTransportTime = (seconds: number, durationSeconds: number): number =>
  Math.min(Math.max(seconds, 0), Math.max(durationSeconds, 0));
