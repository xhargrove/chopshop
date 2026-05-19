export const API_ERRORS = {
  INVALID_FORM_DATA: {
    code: 400,
    message: "The separation request must include a valid audio file.",
  },
  UNSUPPORTED_AUDIO_TYPE: {
    code: 415,
    message: "Only WAV and MP3 files can be separated.",
  },
  FILE_TOO_LARGE: {
    code: 413,
    message: "Audio files must be 200MB or smaller.",
  },
  DEMUCS_NOT_CONFIGURED: {
    code: 500,
    message: "Stem separation is not configured. Set DEMUCS_API_URL before running separation.",
  },
  DEMUCS_TIMEOUT: {
    code: 504,
    message: "Stem separation timed out after 120 seconds. Try a shorter region or a smaller file.",
  },
  DEMUCS_UPSTREAM_ERROR: {
    code: 502,
    message: "The stem separation service returned an error.",
  },
} as const;

export type ApiErrorKey = keyof typeof API_ERRORS;
