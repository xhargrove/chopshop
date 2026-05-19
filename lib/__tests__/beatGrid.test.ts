import { describe, expect, it } from "vitest";

import { MAX_BPM, MIN_BPM, SECONDS_PER_MINUTE } from "@/lib/constants";
import { getBarsInRange, getBeatPosition, getBeatsInRange, getNearestBeatIndex, getPhrasesInRange } from "@/lib/beatGrid";

describe("beat grid utilities", () => {
  it("returns beat positions from a zero-indexed beat", () => {
    expect(getBeatPosition(4, 120, 0)).toBeCloseTo(2, 3);
  });

  it("returns the nearest beat index for a time", () => {
    expect(getNearestBeatIndex(1.95, 120, 0)).toBe(4);
  });

  it("returns every beat in an inclusive eight-bar range", () => {
    const beatDuration = SECONDS_PER_MINUTE / 128;
    expect(getBeatsInRange(0, 32 * beatDuration, 128, 0)).toHaveLength(33);
  });

  it("handles positive beat offsets", () => {
    expect(getBeatPosition(2, 120, 0.25)).toBeCloseTo(1.25, 3);
    expect(getNearestBeatIndex(1.2, 120, 0.25)).toBe(2);
  });

  it("handles negative beat offsets", () => {
    expect(getBeatPosition(2, 120, -0.25)).toBeCloseTo(0.75, 3);
    expect(getNearestBeatIndex(0.76, 120, -0.25)).toBe(2);
  });

  it("supports the minimum BPM edge", () => {
    expect(getBeatPosition(4, MIN_BPM, 0)).toBeCloseTo(4, 3);
  });

  it("supports the maximum BPM edge", () => {
    expect(getBeatPosition(11, MAX_BPM, 0)).toBeCloseTo(3, 3);
  });

  it("returns bar positions every four beats", () => {
    expect(getBarsInRange(0, 4, 120, 0)).toEqual([0, 2, 4]);
  });

  it("returns phrase positions every eight bars by default", () => {
    expect(getPhrasesInRange(0, 32, 120, 0)).toEqual([0, 16, 32]);
  });
});
