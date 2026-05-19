import { ANALYSIS_PROGRESS_COMPLETE, ANALYSIS_PROGRESS_HALF, INT16_MAX, INT16_MIN, MP3_FRAME_SAMPLES, WAV_HEADER_BYTES } from "@/lib/constants";
import type { ExportInMessage, ExportOutMessage } from "@/types/audioExport";

interface LameModule {
  Mp3Encoder: new (channels: number, sampleRate: number, bitrate: number) => {
    encodeBuffer: (left: Int16Array, right?: Int16Array) => Int8Array | Uint8Array;
    flush: () => Int8Array | Uint8Array;
  };
}

interface FflateModule {
  zipSync: (files: Record<string, Uint8Array>) => Uint8Array;
  strToU8: (value: string) => Uint8Array;
}

interface AudioExportWorkerScope {
  postMessage: (response: ExportOutMessage) => void;
  onmessage: ((event: MessageEvent<ExportInMessage>) => void) | null;
}

const ctx = self as AudioExportWorkerScope;

const postWorkerResponse = (response: ExportOutMessage): void => {
  ctx.postMessage(response);
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const clampSample = (sample: number): number => Math.max(-1, Math.min(1, sample));

const floatToInt16 = (sample: number): number => {
  const clipped = clampSample(sample);
  return clipped < 0 ? clipped * -INT16_MIN : clipped * INT16_MAX;
};

const writeAscii = (view: DataView, offset: number, value: string): void => {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
};

const encodeWav = (buffer: Float32Array, sampleRate: number, numChannels: number): Blob => {
  const dataBytes = buffer.length * 2;
  const arrayBuffer = new ArrayBuffer(WAV_HEADER_BYTES + dataBytes);
  const view = new DataView(arrayBuffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  buffer.forEach((sample, index) => {
    view.setInt16(WAV_HEADER_BYTES + index * 2, floatToInt16(sample), true);
  });

  return new Blob([arrayBuffer], { type: "audio/wav" });
};

const splitInterleaved = (buffer: Float32Array, numChannels: number): [Int16Array, Int16Array] => {
  const frameCount = Math.floor(buffer.length / numChannels);
  const left = new Int16Array(frameCount);
  const right = new Int16Array(frameCount);

  for (let frame = 0; frame < frameCount; frame += 1) {
    left[frame] = floatToInt16(buffer[frame * numChannels]);
    right[frame] = floatToInt16(buffer[frame * numChannels + Math.min(1, numChannels - 1)]);
  }

  return [left, right];
};

const concatUint8Arrays = (chunks: readonly Uint8Array[]): ArrayBuffer => {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });

  return merged.buffer;
};

const loadLame = async (): Promise<LameModule> => {
  const moduleValue: unknown = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js");

  if (isRecord(moduleValue) && typeof moduleValue.Mp3Encoder === "function") {
    return moduleValue as unknown as LameModule;
  }

  if (isRecord(moduleValue) && isRecord(moduleValue.default) && typeof moduleValue.default.Mp3Encoder === "function") {
    return moduleValue.default as unknown as LameModule;
  }

  throw new Error("MP3 encoder failed to load.");
};

const loadFflate = async (): Promise<FflateModule> => {
  const moduleValue: unknown = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/fflate@0.8.2/+esm");

  if (isRecord(moduleValue) && typeof moduleValue.zipSync === "function" && typeof moduleValue.strToU8 === "function") {
    return moduleValue as unknown as FflateModule;
  }

  throw new Error("ZIP encoder failed to load.");
};

const encodeMp3 = async (buffer: Float32Array, sampleRate: number, numChannels: number, bitrate: number): Promise<Blob> => {
  const lame = await loadLame();
  const encoder = new lame.Mp3Encoder(numChannels, sampleRate, bitrate);
  const [left, right] = splitInterleaved(buffer, numChannels);
  const chunks: Uint8Array[] = [];

  for (let offset = 0; offset < left.length; offset += MP3_FRAME_SAMPLES) {
    const leftChunk = left.subarray(offset, offset + MP3_FRAME_SAMPLES);
    const rightChunk = right.subarray(offset, offset + MP3_FRAME_SAMPLES);
    const encoded = encoder.encodeBuffer(leftChunk, numChannels > 1 ? rightChunk : undefined);

    if (encoded.length > 0) {
      chunks.push(new Uint8Array(encoded));
    }

    postWorkerResponse({ type: "PROGRESS", percent: Math.min((offset / left.length) * ANALYSIS_PROGRESS_COMPLETE, 95) });
  }

  const flushChunk = encoder.flush();

  if (flushChunk.length > 0) {
    chunks.push(new Uint8Array(flushChunk));
  }

  return new Blob([concatUint8Arrays(chunks)], { type: "audio/mpeg" });
};

const blobToUint8Array = async (blob: Blob): Promise<Uint8Array> => new Uint8Array(await blob.arrayBuffer());

const encodeStemZip = async (stems: Record<string, Float32Array>, sampleRate: number, format: "wav" | "mp3"): Promise<Blob> => {
  const fflate = await loadFflate();
  const files: Record<string, Uint8Array> = {};
  const stemNames = Object.keys(stems).sort();

  for (const [index, stemName] of stemNames.entries()) {
    const stemBuffer = stems[stemName];
    const blob = format === "wav" ? encodeWav(stemBuffer, sampleRate, 2) : await encodeMp3(stemBuffer, sampleRate, 2, 320);
    files[`stems/${stemName}.${format}`] = await blobToUint8Array(blob);
    postWorkerResponse({ type: "PROGRESS", percent: ((index + 1) / stemNames.length) * ANALYSIS_PROGRESS_COMPLETE });
  }

  files["stems/README.txt"] = fflate.strToU8(`Chop Shop stem export\n\nStems: ${stemNames.join(", ")}\nExported: ${new Date().toISOString()}\n`);
  return new Blob([concatUint8Arrays([fflate.zipSync(files)])], { type: "application/zip" });
};

ctx.onmessage = (event: MessageEvent<ExportInMessage>): void => {
  void (async () => {
    const message = event.data;
    postWorkerResponse({ type: "PROGRESS", percent: 0 });

    if (message.type === "EXPORT_WAV") {
      postWorkerResponse({ type: "PROGRESS", percent: ANALYSIS_PROGRESS_HALF });
      postWorkerResponse({ type: "COMPLETE", blob: encodeWav(message.buffer, message.sampleRate, message.numChannels), filename: "export.wav" });
      return;
    }

    if (message.type === "EXPORT_MP3") {
      const blob = await encodeMp3(message.buffer, message.sampleRate, message.numChannels, message.bitrate);
      postWorkerResponse({ type: "COMPLETE", blob, filename: "export.mp3" });
      return;
    }

    const blob = await encodeStemZip(message.stems, message.sampleRate, message.format);
    postWorkerResponse({ type: "COMPLETE", blob, filename: "stems.zip" });
  })().catch((error: unknown) => {
    postWorkerResponse({ type: "ERROR", message: error instanceof Error ? error.message : String(error) });
  });
};

export {};
