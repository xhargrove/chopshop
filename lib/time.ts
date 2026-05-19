import { AUDIO_TIME_DECIMALS, SECONDS_PER_MINUTE, TIME_SECONDS_PAD_LENGTH } from "@/lib/constants";

export const formatTime = (seconds: number): string => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
  const minutes = Math.floor(safeSeconds / SECONDS_PER_MINUTE);
  const remainingSeconds = safeSeconds - minutes * SECONDS_PER_MINUTE;

  return `${minutes}:${remainingSeconds.toFixed(AUDIO_TIME_DECIMALS).padStart(TIME_SECONDS_PAD_LENGTH, "0")}`;
};
