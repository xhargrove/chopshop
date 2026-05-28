import { describe, expect, it } from "vitest";

import { getFitPixelsPerSecond, getNextZoom } from "@/lib/waveformViewport";

describe("waveformViewport", () => {
  it("fits the full track into the viewport width", () => {
    expect(getFitPixelsPerSecond(800, 200)).toBe(4);
    expect(getFitPixelsPerSecond(800, 10)).toBe(80);
    expect(getFitPixelsPerSecond(800, 2000)).toBe(1);
  });

  it("clamps zoom steps to configured bounds", () => {
    expect(getNextZoom(40, 1)).toBe(44);
    expect(getNextZoom(20, -1)).toBe(20);
  });
});
