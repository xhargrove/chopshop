import { detectOffsetFromMono } from "@/lib/audioMix";
import {
  ANALYSIS_PROGRESS_COMPLETE,
  ANALYSIS_PROGRESS_HALF,
  ANALYSIS_PROGRESS_START,
  CAMELOT_MAP,
  MAX_BPM,
  MIN_BPM,
  SECONDS_PER_MINUTE,
  VALID_CAMELOT_VALUES,
} from "@/lib/constants";
import type { WorkerInMessage, WorkerOutMessage } from "@/types/audioAnalysis";

interface AudioAnalysisWorkerScope {
  postMessage: (response: WorkerOutMessage) => void;
  onmessage: ((event: MessageEvent<WorkerInMessage>) => void) | null;
}

const ctx = self as AudioAnalysisWorkerScope;
let cancelled = false;

const postWorkerResponse = (response: WorkerOutMessage): void => {
  ctx.postMessage(response);
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const getNumber = (record: Record<string, unknown>, key: string): number | null => {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const roundBpm = (bpm: number): number => Number(Math.min(Math.max(bpm, MIN_BPM), MAX_BPM).toFixed(2));

const clampConfidence = (confidence: number): number => Math.min(Math.max(confidence, 0), 1);

interface PcmAudio {
  samples: Float32Array;
  sampleRate: number;
}

interface WavFormat {
  audioFormat: number;
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  dataOffset: number;
  dataLength: number;
}

const readString = (view: DataView, offset: number, length: number): string =>
  Array.from({ length }, (_value, index) => String.fromCharCode(view.getUint8(offset + index))).join("");

const parseWavFormat = (buffer: ArrayBuffer): WavFormat | null => {
  const view = new DataView(buffer);

  if (view.byteLength < 44 || readString(view, 0, 4) !== "RIFF" || readString(view, 8, 4) !== "WAVE") {
    return null;
  }

  let offset = 12;
  let audioFormat = 1;
  let channels = 1;
  let sampleRate = 0;
  let bitsPerSample = 16;
  let dataOffset = 0;
  let dataLength = 0;

  while (offset + 8 <= view.byteLength) {
    const chunkId = readString(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;

    if (chunkId === "fmt ") {
      audioFormat = view.getUint16(chunkDataOffset, true);
      channels = view.getUint16(chunkDataOffset + 2, true);
      sampleRate = view.getUint32(chunkDataOffset + 4, true);
      bitsPerSample = view.getUint16(chunkDataOffset + 14, true);
    }

    if (chunkId === "data") {
      dataOffset = chunkDataOffset;
      dataLength = chunkSize;
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  return dataOffset > 0 && dataLength > 0 && sampleRate > 0 ? { audioFormat, channels, sampleRate, bitsPerSample, dataOffset, dataLength } : null;
};

const decodeWav = (buffer: ArrayBuffer, fallbackSampleRate: number): PcmAudio => {
  const format = parseWavFormat(buffer);

  if (!format) {
    return { samples: new Float32Array(buffer), sampleRate: fallbackSampleRate };
  }

  const view = new DataView(buffer, format.dataOffset, format.dataLength);
  const bytesPerSample = format.bitsPerSample / 8;
  const frameCount = Math.floor(format.dataLength / bytesPerSample / format.channels);
  const samples = new Float32Array(frameCount);

  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0;

    for (let channel = 0; channel < format.channels; channel += 1) {
      const sampleOffset = (frame * format.channels + channel) * bytesPerSample;

      if (format.audioFormat === 3 && format.bitsPerSample === 32) {
        sum += view.getFloat32(sampleOffset, true);
      } else if (format.bitsPerSample === 8) {
        sum += (view.getUint8(sampleOffset) - 128) / 128;
      } else if (format.bitsPerSample === 16) {
        sum += view.getInt16(sampleOffset, true) / 32768;
      } else if (format.bitsPerSample === 24) {
        const raw = view.getUint8(sampleOffset) | (view.getUint8(sampleOffset + 1) << 8) | (view.getUint8(sampleOffset + 2) << 16);
        const signed = raw & 0x800000 ? raw | 0xff000000 : raw;
        sum += signed / 8388608;
      } else {
        sum += view.getInt32(sampleOffset, true) / 2147483648;
      }
    }

    samples[frame] = sum / format.channels;
  }

  return { samples, sampleRate: format.sampleRate };
};

const buildOnsetEnvelope = (samples: Float32Array, windowSize: number): Float32Array => {
  const envelopeLength = Math.floor(samples.length / windowSize);
  const envelope = new Float32Array(envelopeLength);
  let previousEnergy = 0;

  for (let index = 0; index < envelopeLength; index += 1) {
    let energy = 0;
    const sampleOffset = index * windowSize;

    for (let sampleIndex = 0; sampleIndex < windowSize; sampleIndex += 1) {
      const sample = samples[sampleOffset + sampleIndex] ?? 0;
      energy += sample * sample;
    }

    const rms = Math.sqrt(energy / windowSize);
    envelope[index] = Math.max(rms - previousEnergy, 0);
    previousEnergy = rms;
  }

  return envelope;
};

const detectBpmFallback = (samples: Float32Array, sampleRate: number): { bpm: number; confidence: number } => {
  const windowSize = 1024;
  const envelope = buildOnsetEnvelope(samples, windowSize);
  const framesPerSecond = sampleRate / windowSize;
  const minimumLag = Math.floor((SECONDS_PER_MINUTE / MAX_BPM) * framesPerSecond);
  const maximumLag = Math.ceil((SECONDS_PER_MINUTE / MIN_BPM) * framesPerSecond);
  let bestLag = minimumLag;
  let bestScore = 0;
  let totalScore = 0;

  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    let score = 0;

    for (let index = lag; index < envelope.length; index += 1) {
      score += envelope[index] * envelope[index - lag];
    }

    totalScore += score;

    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  const bpm = roundBpm(SECONDS_PER_MINUTE / (bestLag / framesPerSecond));
  return { bpm, confidence: clampConfidence(totalScore > 0 ? bestScore / totalScore : 0) };
};

const loadEssentiaInstance = async (): Promise<object | null> => {
  try {
    const [coreModule, wasmModule] = await Promise.all([
      import("essentia.js/dist/essentia.js-core.es.js"),
      import("essentia.js/dist/essentia-wasm.es.js"),
    ]);
    const moduleValue: unknown = {
      Essentia: coreModule.default,
      EssentiaWASM: wasmModule.EssentiaWASM,
    };

    if (!isRecord(moduleValue) || typeof moduleValue.Essentia !== "function") {
      return null;
    }

    return Reflect.construct(moduleValue.Essentia, [moduleValue.EssentiaWASM]);
  } catch {
    return null;
  }
};

const tryEssentiaBpm = async (samples: Float32Array): Promise<{ bpm: number; confidence: number } | null> => {
  try {
    const instance = await loadEssentiaInstance();

    if (!instance) {
      return null;
    }

    const arrayToVector = Reflect.get(instance, "arrayToVector");
    const rhythmExtractor = Reflect.get(instance, "RhythmExtractor2013");

    if (typeof arrayToVector !== "function" || typeof rhythmExtractor !== "function") {
      return null;
    }

    const vector = Reflect.apply(arrayToVector, instance, [samples]);
    const result = Reflect.apply(rhythmExtractor, instance, [vector]);

    if (!isRecord(result)) {
      return null;
    }

    const bpm = getNumber(result, "bpm");
    const confidence = getNumber(result, "confidence");

    return bpm ? { bpm: roundBpm(bpm), confidence: clampConfidence(confidence ?? 0.4) } : null;
  } catch {
    return null;
  }
};

const normalizeEssentiaScale = (scale: string): "major" | "minor" | null => {
  const normalizedScale = scale.toLowerCase();

  if (normalizedScale.includes("major")) {
    return "major";
  }

  if (normalizedScale.includes("minor")) {
    return "minor";
  }

  return null;
};

const tryEssentiaKey = async (samples: Float32Array, sampleRate: number): Promise<{ key: string; confidence: number } | null> => {
  try {
    const instance = await loadEssentiaInstance();

    if (!instance) {
      return null;
    }

    const arrayToVector = Reflect.get(instance, "arrayToVector");
    const keyExtractor = Reflect.get(instance, "KeyExtractor");

    if (typeof arrayToVector !== "function" || typeof keyExtractor !== "function") {
      return null;
    }

    const vector = Reflect.apply(arrayToVector, instance, [samples]);
    const result = Reflect.apply(keyExtractor, instance, [vector, true, 4096, 4096, 12, 3500, 25, 0.2, "bgate", sampleRate]);

    if (!isRecord(result) || typeof result.key !== "string" || typeof result.scale !== "string") {
      return null;
    }

    const scale = normalizeEssentiaScale(result.scale);
    const camelotKey = scale ? CAMELOT_MAP[`${result.key} ${scale}`] : null;
    const confidence = getNumber(result, "strength") ?? getNumber(result, "confidence") ?? 0.4;

    return camelotKey && VALID_CAMELOT_VALUES.has(camelotKey) ? { key: camelotKey, confidence: clampConfidence(confidence) } : null;
  } catch {
    return null;
  }
};

const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "Bb", "B"] as const;
const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88] as const;
const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17] as const;

const correlateProfile = (chroma: readonly number[], profile: readonly number[], tonicIndex: number): number =>
  profile.reduce((sum, weight, index) => sum + weight * chroma[(index + tonicIndex) % chroma.length], 0);

const detectKeyFallback = (samples: Float32Array, sampleRate: number): { key: string; confidence: number } => {
  const windowSize = 4096;
  const step = windowSize;
  const chroma = new Array<number>(noteNames.length).fill(0);

  for (let offset = 0; offset + windowSize < samples.length; offset += step) {
    for (let pitchClass = 0; pitchClass < noteNames.length; pitchClass += 1) {
      for (let octave = 2; octave <= 6; octave += 1) {
        const midi = (octave + 1) * 12 + pitchClass;
        const frequency = 440 * 2 ** ((midi - 69) / 12);
        const normalizedFrequency = frequency / sampleRate;
        let real = 0;
        let imaginary = 0;

        for (let index = 0; index < windowSize; index += 1) {
          const angle = 2 * Math.PI * normalizedFrequency * index;
          const sample = samples[offset + index] ?? 0;
          real += sample * Math.cos(angle);
          imaginary -= sample * Math.sin(angle);
        }

        chroma[pitchClass] += real * real + imaginary * imaginary;
      }
    }
  }

  const totalEnergy = chroma.reduce((sum, value) => sum + value, 0) || 1;
  const normalizedChroma = chroma.map((value) => value / totalEnergy);
  let bestName = "C major";
  let bestScore = Number.NEGATIVE_INFINITY;
  let secondScore = Number.NEGATIVE_INFINITY;

  for (let tonic = 0; tonic < noteNames.length; tonic += 1) {
    const majorScore = correlateProfile(normalizedChroma, majorProfile, tonic);
    const minorScore = correlateProfile(normalizedChroma, minorProfile, tonic);

    [
      { name: `${noteNames[tonic]} major`, score: majorScore },
      { name: `${noteNames[tonic]} minor`, score: minorScore },
    ].forEach((candidate) => {
      if (candidate.score > bestScore) {
        secondScore = bestScore;
        bestScore = candidate.score;
        bestName = candidate.name;
      } else if (candidate.score > secondScore) {
        secondScore = candidate.score;
      }
    });
  }

  const camelotKey = CAMELOT_MAP[bestName] ?? "8B";
  return {
    key: VALID_CAMELOT_VALUES.has(camelotKey) ? camelotKey : "8B",
    confidence: clampConfidence(bestScore > 0 ? (bestScore - secondScore) / bestScore : 0),
  };
};

const handleAnalysis = async (message: Exclude<WorkerInMessage, { type: "CANCEL" } | { type: "DETECT_OFFSET" }>): Promise<void> => {
  cancelled = false;
  const pcmAudio = decodeWav(message.audioBuffer, message.sampleRate);

  if (message.type === "ANALYZE_BPM" || message.type === "ANALYZE_ALL") {
    postWorkerResponse({ type: "PROGRESS", stage: "bpm", percent: ANALYSIS_PROGRESS_START });
    const bpmResult = (await tryEssentiaBpm(pcmAudio.samples)) ?? detectBpmFallback(pcmAudio.samples, pcmAudio.sampleRate);

    if (cancelled) {
      postWorkerResponse({ type: "CANCELLED" });
      return;
    }

    postWorkerResponse({ type: "BPM_RESULT", bpm: bpmResult.bpm, confidence: bpmResult.confidence });
    postWorkerResponse({ type: "PROGRESS", stage: "bpm", percent: ANALYSIS_PROGRESS_HALF });
  }

  if (message.type === "ANALYZE_KEY" || message.type === "ANALYZE_ALL") {
    if (cancelled) {
      postWorkerResponse({ type: "CANCELLED" });
      return;
    }

    postWorkerResponse({ type: "PROGRESS", stage: "key", percent: ANALYSIS_PROGRESS_HALF });
    const keyResult = (await tryEssentiaKey(pcmAudio.samples, pcmAudio.sampleRate)) ?? detectKeyFallback(pcmAudio.samples, pcmAudio.sampleRate);

    if (cancelled) {
      postWorkerResponse({ type: "CANCELLED" });
      return;
    }

    postWorkerResponse({ type: "KEY_RESULT", key: keyResult.key, confidence: keyResult.confidence });
    postWorkerResponse({ type: "PROGRESS", stage: "key", percent: ANALYSIS_PROGRESS_COMPLETE });
  }
};

ctx.onmessage = (event: MessageEvent<WorkerInMessage>): void => {
  const message = event.data;

  if (message.type === "CANCEL") {
    cancelled = true;
    postWorkerResponse({ type: "CANCELLED" });
    return;
  }

  if (message.type === "DETECT_OFFSET") {
    try {
      const offsetSeconds = detectOffsetFromMono(message.bufferA, message.bufferB, message.sampleRate);
      postWorkerResponse({ type: "OFFSET_RESULT", offsetSeconds });
    } catch (error: unknown) {
      postWorkerResponse({ type: "ERROR", message: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  void handleAnalysis(message).catch((error: unknown) => {
    postWorkerResponse({ type: "ERROR", message: error instanceof Error ? error.message : String(error) });
  });
};

export {};
