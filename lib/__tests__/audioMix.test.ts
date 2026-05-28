import { describe, expect, it } from "vitest";

import { detectOffsetFromMono, normalizePeak } from "@/lib/audioMix";

describe("audio mix utilities", () => {
  it("normalizes peak level without mutating input", () => {
    const source = new Float32Array([0, 0.25, -0.5]);
    const normalized = normalizePeak(source, 1);

    expect(source[2]).toBe(-0.5);
    expect(normalized[1]).toBeCloseTo(0.5);
    expect(normalized[2]).toBeCloseTo(-1);
  });

  it("keeps silent buffers silent", () => {
    expect(Array.from(normalizePeak(new Float32Array([0, 0, 0])))).toEqual([0, 0, 0]);
  });

  it("detects positive offset when the second signal is delayed", () => {
    const sampleRate = 1000;
    const length = 1000;
    const delayFrames = 200;
    const bufferA = new Float32Array(length);
    const bufferB = new Float32Array(length);

    for (let index = 0; index < length; index += 1) {
      bufferA[index] = Math.sin((2 * Math.PI * 220 * index) / sampleRate);
      bufferB[index] = index < delayFrames ? 0 : bufferA[index - delayFrames];
    }

    expect(detectOffsetFromMono(bufferA, bufferB, sampleRate)).toBeCloseTo(
      delayFrames / sampleRate,
      2,
    );
  });
});
