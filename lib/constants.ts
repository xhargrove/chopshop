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

// PHASE 2 CHANGE: The editor stores region and cue times at millisecond precision.
export const AUDIO_TIME_DECIMALS = 3;
export const AUDIO_START_SECONDS = 0;
export const PERCENTAGE_MULTIPLIER = 100;
export const SECONDS_PER_MINUTE = 60;
export const MILLISECONDS_PER_SECOND = 1000;
export const TIME_SECONDS_PAD_LENGTH = 6;
export const LONG_TIME_SECONDS_PAD_LENGTH = 2;
export const DEFAULT_BEATS_PER_BAR = 4;
export const DEFAULT_SNAP_DIVISION = 4;
export const BPM_DECIMALS = 2;
export const FILE_SIZE_DECIMALS = 1;
export const BYTES_PER_KILOBYTE = 1024;

export const WAVEFORM_HEIGHT = 120;
export const WAVEFORM_CURSOR_WIDTH = 2;
export const WAVEFORM_SCROLL_ZOOM_STEP = 4;
export const WAVEFORM_MIN_PX_PER_SECOND = 20;
export const WAVEFORM_MAX_PX_PER_SECOND = 400;
export const WAVEFORM_SYNC_TOLERANCE_SECONDS = 0.05;
export const REGION_HANDLE_WIDTH_PX = 8;
export const REGION_LABEL_FONT_SIZE_PX = 11;
export const REGION_LABEL_X_OFFSET_PX = 6;
export const REGION_LABEL_Y_OFFSET_PX = 14;
export const CUE_MARKER_SIZE_PX = 10;
export const CUE_BADGE_SIZE_PX = 18;
export const CUE_LINE_DASH_PX = 4;
export const CUE_LINE_GAP_PX = 4;
export const CONTEXT_MENU_OFFSET_PX = 8;
export const EDITOR_NUDGE_SMALL_SECONDS = 0.1;
export const EDITOR_NUDGE_LARGE_SECONDS = 1;
export const MAX_HOTKEY_CUE_POINTS = 8;
export const EMPTY_SELECTION = "";

export const DESIGN_COLORS = {
  background: "#080808",
  surface: "#111111",
  border: "#1e1e1e",
  accent: "#FF3D00",
  textPrimary: "#F0F0F0",
  textMuted: "#555555",
} as const;

export const REGION_COLORS = {
  intro: {
    fill: "rgba(255, 61, 0, 0.25)",
    border: "#FF3D00",
  },
  outro: {
    fill: "rgba(0, 229, 255, 0.15)",
    border: "#00E5FF",
  },
  loop: {
    fill: "rgba(105, 255, 71, 0.15)",
    border: "#69FF47",
  },
  selection: {
    fill: "rgba(255, 214, 0, 0.15)",
    border: "#FFD600",
  },
} as const;

export const REGION_LABELS = {
  intro: "Intro",
  outro: "Outro",
  loop: "Loop",
  selection: "Selection",
} as const;

export const CUE_COLORS = ["#FF3D00", "#00E5FF", "#69FF47", "#FFD600", "#B388FF", "#FF5C8A", "#64FFDA", "#FFAB40"] as const;
