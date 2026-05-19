import {
  ACCEPTED_AUDIO_EXTENSIONS,
  ACCEPTED_AUDIO_TYPES,
  AUDIO_TIME_DECIMALS,
  BYTES_PER_MEGABYTE,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "@/lib/constants";

type AudioFileValidationResult =
  | {
      isValid: true;
      error: null;
    }
  | {
      isValid: false;
      error: string;
    };

const formatFileSize = (sizeBytes: number): string => (sizeBytes / BYTES_PER_MEGABYTE).toFixed(AUDIO_TIME_DECIMALS);

const hasAcceptedExtension = (fileName: string): boolean => {
  const normalizedName = fileName.toLowerCase();

  return ACCEPTED_AUDIO_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
};

const hasAcceptedMimeType = (mimeType: string): boolean => ACCEPTED_AUDIO_TYPES.some((acceptedType) => acceptedType === mimeType);

export const getAcceptedAudioDescription = (): string => `${ACCEPTED_AUDIO_EXTENSIONS.join(" ")} · ${MAX_FILE_SIZE_MB}MB max`;

export const validateAudioFile = (file: File): AudioFileValidationResult => {
  if (!hasAcceptedExtension(file.name) || !hasAcceptedMimeType(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file type. Use ${ACCEPTED_AUDIO_EXTENSIONS.join(", ")} files with matching audio metadata.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `${file.name} is ${formatFileSize(file.size)}MB. The maximum file size is ${MAX_FILE_SIZE_MB}MB.`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
};
