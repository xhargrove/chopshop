import { DEFAULT_NORMALIZE_PEAK, MAX_OFFSET_CORRELATION_SECONDS } from "@/lib/constants";

const getChannel = (audioBuffer: AudioBuffer, channelIndex: number): Float32Array =>
  audioBuffer.getChannelData(Math.min(channelIndex, audioBuffer.numberOfChannels - 1));

export function normalizePeak(buffer: Float32Array, targetPeak: number = DEFAULT_NORMALIZE_PEAK): Float32Array {
  const peak = buffer.reduce((maxPeak, sample) => Math.max(maxPeak, Math.abs(sample)), 0);

  if (peak === 0) {
    return new Float32Array(buffer);
  }

  const gain = targetPeak / peak;
  return Float32Array.from(buffer, (sample) => sample * gain);
}

export function mixBuffers(ctx: AudioContext, a: AudioBuffer, b: AudioBuffer, gainA: number, gainB: number, offsetASeconds: number = 0): AudioBuffer {
  const sampleRate = a.sampleRate;
  const offsetFrames = Math.round(offsetASeconds * sampleRate);
  const preRollFrames = Math.max(-offsetFrames, 0);
  const aStartFrame = Math.max(offsetFrames, 0);
  const outputLength = Math.max(aStartFrame + a.length, preRollFrames + b.length);
  const output = ctx.createBuffer(2, outputLength, sampleRate);

  for (let channel = 0; channel < output.numberOfChannels; channel += 1) {
    const outputData = output.getChannelData(channel);
    const aData = normalizePeak(getChannel(a, channel));
    const bData = normalizePeak(getChannel(b, channel));

    aData.forEach((sample, index) => {
      outputData[aStartFrame + index] += sample * gainA;
    });

    bData.forEach((sample, index) => {
      outputData[preRollFrames + index] += sample * gainB;
    });
  }

  return output;
}

const getMonoSlice = (audioBuffer: AudioBuffer, maxSamples: number): Float32Array => {
  const sampleCount = Math.min(audioBuffer.length, maxSamples);
  const mono = new Float32Array(sampleCount);

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);

    for (let index = 0; index < sampleCount; index += 1) {
      mono[index] += data[index] / audioBuffer.numberOfChannels;
    }
  }

  return normalizePeak(mono, 1);
};

export function detectOffsetFromMono(aData: Float32Array, bData: Float32Array, sampleRate: number): number {
  const maxLag = Math.min(Math.round(MAX_OFFSET_CORRELATION_SECONDS * sampleRate), aData.length, bData.length);
  let bestLag = 0;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let lag = -maxLag; lag <= maxLag; lag += 1) {
    let score = 0;
    const startA = Math.max(lag, 0);
    const startB = Math.max(-lag, 0);
    const overlap = Math.min(aData.length - startA, bData.length - startB);

    for (let index = 0; index < overlap; index += 1) {
      score += aData[startA + index] * bData[startB + index];
    }

    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  return -bestLag / sampleRate;
}

export function detectOffset(a: AudioBuffer, b: AudioBuffer): number {
  const sampleRate = Math.min(a.sampleRate, b.sampleRate);
  const analysisLength = Math.min(a.length, b.length, sampleRate * 30);
  const aData = getMonoSlice(a, analysisLength);
  const bData = getMonoSlice(b, analysisLength);

  return detectOffsetFromMono(aData, bData, sampleRate);
}
