import { BLEEP_FADE_SECONDS, BLEEP_FREQUENCY_HZ, DUCK_GAIN } from "@/lib/constants";
import type { BleepRegion } from "@/types/audio";

const clampRegionFrames = (start: number, end: number, length: number): { startFrame: number; endFrame: number } => ({
  startFrame: Math.max(Math.min(start, length), 0),
  endFrame: Math.max(Math.min(end, length), 0),
});

export function generateBleepTone(durationSeconds: number, sampleRate: number, frequencyHz: number = BLEEP_FREQUENCY_HZ): Float32Array {
  const length = Math.max(Math.round(durationSeconds * sampleRate), 0);
  const fadeLength = Math.min(Math.round(BLEEP_FADE_SECONDS * sampleRate), Math.floor(length / 2));

  return Float32Array.from({ length }, (_value, index) => {
    const fadeIn = fadeLength > 0 ? Math.min(index / fadeLength, 1) : 1;
    const fadeOut = fadeLength > 0 ? Math.min((length - index - 1) / fadeLength, 1) : 1;
    const gain = Math.min(fadeIn, fadeOut);
    return Math.sin((2 * Math.PI * frequencyHz * index) / sampleRate) * gain;
  });
}

export function applyBleepRegions(pcm: Float32Array, regions: BleepRegion[], sampleRate: number): Float32Array {
  const output = new Float32Array(pcm);

  regions.forEach((region) => {
    const { startFrame, endFrame } = clampRegionFrames(Math.floor(region.start * sampleRate) * 2, Math.ceil(region.end * sampleRate) * 2, output.length);

    if (endFrame <= startFrame) {
      return;
    }

    if (region.mode === "mute") {
      output.fill(0, startFrame, endFrame);
      return;
    }

    if (region.mode === "duck") {
      for (let index = startFrame; index < endFrame; index += 1) {
        output[index] *= DUCK_GAIN;
      }
      return;
    }

    const frameCount = Math.floor((endFrame - startFrame) / 2);
    const tone = generateBleepTone(frameCount / sampleRate, sampleRate);

    for (let frame = 0; frame < frameCount; frame += 1) {
      output[startFrame + frame * 2] = tone[frame];
      output[startFrame + frame * 2 + 1] = tone[frame];
    }
  });

  return output;
}
