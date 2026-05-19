import {
  BPM_DECIMALS,
  BYTES_PER_KILOBYTE,
  BYTES_PER_MEGABYTE,
  FILE_SIZE_DECIMALS,
  LONG_TIME_SECONDS_PAD_LENGTH,
  SECONDS_PER_MINUTE,
  TIME_SECONDS_PAD_LENGTH,
} from "@/lib/constants";

const clampTime = (seconds: number): number => (Number.isFinite(seconds) ? Math.max(seconds, 0) : 0);

export function formatDuration(seconds: number): string {
  const safeSeconds = clampTime(seconds);
  const minutes = Math.floor(safeSeconds / SECONDS_PER_MINUTE);
  const remainingSeconds = safeSeconds - minutes * SECONDS_PER_MINUTE;

  return `${minutes}:${remainingSeconds.toFixed(3).padStart(TIME_SECONDS_PAD_LENGTH, "0")}`;
}

export function formatTime(seconds: number): string {
  const safeSeconds = clampTime(seconds);
  const hours = Math.floor(safeSeconds / (SECONDS_PER_MINUTE * SECONDS_PER_MINUTE));
  const minutes = Math.floor((safeSeconds % (SECONDS_PER_MINUTE * SECONDS_PER_MINUTE)) / SECONDS_PER_MINUTE);
  const remainingSeconds = Math.floor(safeSeconds % SECONDS_PER_MINUTE);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(LONG_TIME_SECONDS_PAD_LENGTH, "0")}:${String(remainingSeconds).padStart(LONG_TIME_SECONDS_PAD_LENGTH, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(LONG_TIME_SECONDS_PAD_LENGTH, "0")}`;
}

export function formatBPM(bpm: number): string {
  return `${bpm.toFixed(BPM_DECIMALS)} BPM`;
}

export function formatKey(key: string): string {
  return key.trim().toUpperCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes >= BYTES_PER_MEGABYTE) {
    const megabytes = bytes / BYTES_PER_MEGABYTE;
    return Number.isInteger(megabytes) ? `${megabytes} MB` : `${megabytes.toFixed(FILE_SIZE_DECIMALS)} MB`;
  }

  if (bytes >= BYTES_PER_KILOBYTE) {
    const kilobytes = bytes / BYTES_PER_KILOBYTE;
    return Number.isInteger(kilobytes) ? `${kilobytes} KB` : `${kilobytes.toFixed(FILE_SIZE_DECIMALS)} KB`;
  }

  return `${bytes} B`;
}
