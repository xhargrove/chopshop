export const ACCEPTED_AUDIO_TYPES = [
  "audio/wav",
  "audio/mpeg",
  "audio/aiff",
  "audio/flac",
  "audio/x-wav",
  "audio/x-aiff",
  "audio/x-flac",
] as const;

export const ACCEPTED_AUDIO_EXTENSIONS = [".wav", ".mp3", ".aiff", ".flac"] as const;

export const AUDIO_EXTENSION_FORMATS = {
  ".wav": "wav",
  ".mp3": "mp3",
  ".aiff": "aiff",
  ".flac": "flac",
} as const;

export const MAX_FILE_SIZE_MB = 200;
export const BYTES_PER_MEGABYTE = 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * BYTES_PER_MEGABYTE;

export const DEFAULT_AUDIO_ZOOM = 1;
export const MIN_AUDIO_ZOOM = 1;
export const MAX_AUDIO_ZOOM = 100;
export const DEFAULT_VOLUME = 0.85;
export const MIN_VOLUME = 0;
export const MAX_VOLUME = 1;
export const VOLUME_STEP = 0.01;
export const DEFAULT_PLAYBACK_RATE = 1;
export const MIN_PLAYBACK_RATE = 0.5;
export const MAX_PLAYBACK_RATE = 2;
export const SEEK_STEP_SECONDS = 5;

export const AUDIO_TIME_DECIMALS = 2;
export const AUDIO_START_SECONDS = 0;
export const PERCENTAGE_MULTIPLIER = 100;
export const SECONDS_PER_MINUTE = 60;
export const MILLISECONDS_PER_SECOND = 1000;
export const TIME_SECONDS_PAD_LENGTH = 5;

export const WAVEFORM_HEIGHT = 120;
export const WAVEFORM_CURSOR_WIDTH = 2;
export const WAVEFORM_SCROLL_ZOOM_STEP = 4;
export const WAVEFORM_MIN_PX_PER_SECOND = 20;
export const WAVEFORM_MAX_PX_PER_SECOND = 400;
export const WAVEFORM_SYNC_TOLERANCE_SECONDS = 0.05;

export const DESIGN_COLORS = {
  background: "#080808",
  surface: "#111111",
  border: "#1e1e1e",
  accent: "#FF3D00",
  textPrimary: "#F0F0F0",
  textMuted: "#555555",
} as const;
