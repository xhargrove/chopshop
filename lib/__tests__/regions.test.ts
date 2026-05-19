import { describe, expect, it } from "vitest";

import { createRegion, extendByBeats, regionsOverlap, snapToBeat } from "@/lib/regions";
import type { WaveformRegion } from "@/types/audio";

const TEST_DURATION_SECONDS = 240;
const TEST_BPM = 120;
const TEST_BEATS = 4;

const region = (id: string, start: number, end: number): WaveformRegion => ({
  id,
  start,
  end,
  type: "selection",
  color: "#FFD600",
  label: id,
});

describe("createRegion", () => {
  it("creates a clamped deterministic region", () => {
    expect(createRegion("intro", -1, 8, TEST_DURATION_SECONDS)).toMatchObject({
      id: "intro-0-8",
      start: 0,
      end: 8,
      type: "intro",
      label: "Intro",
    });
  });
});

describe("snapToBeat", () => {
  it("snaps to the nearest full beat", () => {
    expect(snapToBeat(1.24, TEST_BPM, 1)).toBe(1);
  });

  it("snaps upward to the nearest full beat", () => {
    expect(snapToBeat(1.26, TEST_BPM, 1)).toBe(1.5);
  });

  it("snaps to the nearest half beat", () => {
    expect(snapToBeat(1.13, TEST_BPM, 2)).toBe(1.25);
  });

  it("snaps to the nearest quarter beat", () => {
    expect(snapToBeat(1.19, TEST_BPM, 4)).toBe(1.25);
  });

  it("keeps exact grid values stable", () => {
    expect(snapToBeat(2, TEST_BPM, 1)).toBe(2);
  });
});

describe("regionsOverlap", () => {
  it("detects partially overlapping regions", () => {
    expect(regionsOverlap(region("a", 0, 8), region("b", 4, 12))).toBe(true);
  });

  it("detects containment overlap", () => {
    expect(regionsOverlap(region("a", 0, 16), region("b", 4, 8))).toBe(true);
  });

  it("treats touching edges as non-overlapping", () => {
    expect(regionsOverlap(region("a", 0, 8), region("b", 8, 16))).toBe(false);
  });

  it("detects disjoint regions", () => {
    expect(regionsOverlap(region("a", 0, 4), region("b", 8, 12))).toBe(false);
  });

  it("is symmetric", () => {
    const first = region("a", 4, 12);
    const second = region("b", 0, 8);

    expect(regionsOverlap(first, second)).toBe(regionsOverlap(second, first));
  });
});

describe("extendByBeats", () => {
  it("extends the end by positive beats", () => {
    expect(extendByBeats(region("loop", 8, 16), TEST_BEATS, TEST_BPM, "end").end).toBe(18);
  });

  it("extends the start earlier by positive beats", () => {
    expect(extendByBeats(region("loop", 8, 16), TEST_BEATS, TEST_BPM, "start").start).toBe(6);
  });

  it("shrinks the end with negative beats", () => {
    expect(extendByBeats(region("loop", 8, 16), -TEST_BEATS, TEST_BPM, "end").end).toBe(14);
  });

  it("shrinks the start with negative beats", () => {
    expect(extendByBeats(region("loop", 8, 16), -TEST_BEATS, TEST_BPM, "start").start).toBe(10);
  });

  it("keeps the opposite boundary unchanged", () => {
    expect(extendByBeats(region("loop", 8, 16), TEST_BEATS, TEST_BPM, "end").start).toBe(8);
  });
});
