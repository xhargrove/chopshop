import { buildFileKey } from "@/lib/sessionPersistence";

export interface DecodedAudioEntry {
  fileKey: string;
  buffer: AudioBuffer;
  /** Copy retained for analysis workers (decode may detach the original). */
  analysisBytes: ArrayBuffer;
}

interface PendingDecode {
  fileKey: string;
  promise: Promise<DecodedAudioEntry>;
}

/**
 * Single-flight decode cache for the active track.
 * Decodes once per file identity (name + size + lastModified).
 */
class AudioBufferCache {
  private entry: DecodedAudioEntry | null = null;

  private pending: PendingDecode | null = null;

  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    return this.audioContext;
  }

  invalidate(): void {
    this.entry = null;
    this.pending = null;
  }

  getEntry(): DecodedAudioEntry | null {
    return this.entry;
  }

  async getOrDecode(file: File): Promise<DecodedAudioEntry> {
    const fileKey = buildFileKey(file);

    if (this.entry?.fileKey === fileKey) {
      return this.entry;
    }

    if (this.pending?.fileKey === fileKey) {
      return this.pending.promise;
    }

    const promise = this.decodeFile(file, fileKey);
    this.pending = { fileKey, promise };

    try {
      const decoded = await promise;
      this.entry = decoded;
      return decoded;
    } finally {
      if (this.pending?.fileKey === fileKey) {
        this.pending = null;
      }
    }
  }

  private async decodeFile(file: File, fileKey: string): Promise<DecodedAudioEntry> {
    const rawBytes = await file.arrayBuffer();
    const analysisBytes = rawBytes.slice(0);
    const audioContext = this.getAudioContext();
    const buffer = await audioContext.decodeAudioData(rawBytes);

    return {
      fileKey,
      buffer,
      analysisBytes,
    };
  }
}

export const audioBufferCache = new AudioBufferCache();

/** Clones channel data for export/worker handoff without sharing mutable buffers. */
export const cloneAudioBufferToStereo = (source: AudioBuffer, startSeconds = 0, endSeconds = source.duration): Float32Array => {
  const startFrame = Math.max(0, Math.floor(startSeconds * source.sampleRate));
  const endFrame = Math.min(source.length, Math.ceil(endSeconds * source.sampleRate));
  const frameCount = Math.max(endFrame - startFrame, 0);
  const interleaved = new Float32Array(frameCount * 2);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const index = startFrame + frame;
    interleaved[frame * 2] = source.getChannelData(0)[index] ?? 0;
    interleaved[frame * 2 + 1] = source.getChannelData(Math.min(1, source.numberOfChannels - 1))[index] ?? 0;
  }

  return interleaved;
};
