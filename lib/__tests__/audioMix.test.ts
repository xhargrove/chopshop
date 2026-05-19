import { describe, expect, it } from "vitest";

import { normalizePeak } from "@/lib/audioMix";

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
});
