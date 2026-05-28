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
export const MAX_SEPARATION_FILE_MB = 200;
export const MAX_SEPARATION_FILE_BYTES = MAX_SEPARATION_FILE_MB * BYTES_PER_MEGABYTE;
export const DEMUCS_TIMEOUT_MS = 120_000;
export const EXPORT_OBJECT_URL_REVOKE_MS = 60_000;
export const EXPORT_DOWNLOAD_STAGGER_MS = 200;
export const WAV_HEADER_BYTES = 44;
export const INT16_MAX = 32767;
export const INT16_MIN = -32768;
export const MP3_FRAME_SAMPLES = 1152;

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
export const PLAYHEAD_UI_UPDATE_MS = 33;
export const TIME_SECONDS_PAD_LENGTH = 6;
export const LONG_TIME_SECONDS_PAD_LENGTH = 2;
export const DEFAULT_BEATS_PER_BAR = 4;
export const DEFAULT_SNAP_DIVISION = 4;
export const BPM_DECIMALS = 2;
export const MIN_BPM = 60;
export const MAX_BPM = 220;
export const BPM_INPUT_STEP = 0.01;
export const LOW_CONFIDENCE_THRESHOLD = 0.5;
export const FILE_SIZE_DECIMALS = 1;
export const BYTES_PER_KILOBYTE = 1024;
export const EDITOR_EXTEND_BAR_OPTIONS = [-4, -1, 1, 4] as const;
export const EDITOR_TRIM_BAR_OPTIONS = [8, 16, 32] as const;
export const DEFAULT_BEAT_OFFSET_SECONDS = 0;
export const MAX_BEAT_GRID_POINTS = 1024;
export const DEFAULT_BARS_PER_PHRASE = 8;
export const MIN_BEAT_GRID_SPACING_PX = 4;
export const BEAT_GRID_LABEL_FONT_SIZE_PX = 10;
export const BEAT_GRID_LABEL_Y_PX = 10;
export const BEAT_GRID_BEAT_COLOR = "rgba(255, 255, 255, 0.06)";
export const BEAT_GRID_BAR_COLOR = "rgba(255, 255, 255, 0.15)";
export const BEAT_GRID_PHRASE_COLOR = "rgba(255, 61, 0, 0.4)";
export const BEAT_GRID_TAP_RESET_MS = 2000;
export const BEAT_OFFSET_NUDGE_SECONDS = 0.01;
export const ANALYSIS_PROGRESS_COMPLETE = 100;
export const ANALYSIS_PROGRESS_HALF = 50;
export const ANALYSIS_PROGRESS_START = 0;

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
export const REGION_MIN_DURATION_SECONDS = 0.001;
export const CUE_MARKER_SIZE_PX = 10;
export const CUE_BADGE_SIZE_PX = 18;
export const CUE_LINE_DASH_PX = 4;
export const CUE_LINE_GAP_PX = 4;
export const CONTEXT_MENU_OFFSET_PX = 8;
export const EDITOR_NUDGE_SMALL_SECONDS = 0.1;
export const EDITOR_NUDGE_LARGE_SECONDS = 1;
export const MAX_HOTKEY_CUE_POINTS = 8;
export const EMPTY_SELECTION = "";
export const DEFAULT_STEM_MODEL = "4stems";
export const STEM_TYPES = ["vocals", "drums", "bass", "other", "guitar", "piano"] as const;
export const STEM_MODEL_TYPES = ["2stems", "4stems", "6stems"] as const;
export const EXPORT_MP3_BITRATES = [128, 192, 320] as const;
export const UNDO_STACK_LIMIT = 50;
export const DEFAULT_TRANSITION_BARS = 4;
export const DEFAULT_TRANSITION_BEATS = 16;
export const BLEEP_FREQUENCY_HZ = 1000;
export const BLEEP_FADE_SECONDS = 0.01;
export const DUCK_GAIN = 0.25;
export const DEFAULT_NORMALIZE_PEAK = 0.9;
export const DEFAULT_SWAP_VOCAL_GAIN = 1;
export const DEFAULT_SWAP_INSTRUMENTAL_GAIN = 0.85;
export const MAX_OFFSET_CORRELATION_SECONDS = 5;
export const BLEEP_REGION_FILL = "rgba(255, 61, 0, 0.3)";
export const BLEEP_REGION_BORDER = "rgba(255, 61, 0, 0.6)";
export const TRANSITION_CUE_COLOR = "#FF3D00";
export const EDITOR_TABS = ["prepare", "edit", "clean", "swap", "transition", "history"] as const;

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
export const CUE_COLOR_DOT_CLASSES = ["bg-cue-1", "bg-cue-2", "bg-cue-3", "bg-cue-4", "bg-cue-5", "bg-cue-6", "bg-cue-7", "bg-cue-8"] as const;

// PHASE 3 CHANGE: Key detection stores validated Camelot notation from detected tonal key/scale.
export const CAMELOT_MAP: Record<string, string> = {
  "C major": "8B",
  "G major": "9B",
  "D major": "10B",
  "A major": "11B",
  "E major": "12B",
  "B major": "1B",
  "F# major": "2B",
  "Db major": "3B",
  "Ab major": "4B",
  "Eb major": "5B",
  "Bb major": "6B",
  "F major": "7B",
  "A minor": "8A",
  "E minor": "9A",
  "B minor": "10A",
  "F# minor": "11A",
  "C# minor": "12A",
  "G# minor": "1A",
  "D# minor": "2A",
  "Bb minor": "3A",
  "F minor": "4A",
  "C minor": "5A",
  "G minor": "6A",
  "D minor": "7A",
};

export const VALID_CAMELOT_VALUES = new Set(Object.values(CAMELOT_MAP));
