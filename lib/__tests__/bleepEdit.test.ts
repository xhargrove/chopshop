import { describe, expect, it } from "vitest";

import { applyBleepRegions, generateBleepTone } from "@/lib/bleepEdit";
import type { BleepRegion } from "@/types/audio";

describe("bleep edit utilities", () => {
  it("generates a bleep tone with fade edges", () => {
    const tone = generateBleepTone(0.1, 44100);
    expect(tone).toHaveLength(4410);
    expect(tone[0]).toBeCloseTo(0);
    expect(Math.max(...tone.map(Math.abs))).toBeGreaterThan(0.5);
  });

  it("mutes a region without mutating the source", () => {
    const pcm = new Float32Array(20).fill(0.5);
    const regions: BleepRegion[] = [{ id: "mute", start: 0.002, end: 0.006, mode: "mute", label: "mute" }];
    const edited = applyBleepRegions(pcm, regions, 1000);

    expect(pcm[4]).toBe(0.5);
    expect(Array.from(edited.slice(4, 12))).toEqual(new Array(8).fill(0));
  });

  it("ducks a region by twelve decibels", () => {
    const pcm = new Float32Array(10).fill(1);
    const edited = applyBleepRegions(pcm, [{ id: "duck", start: 0, end: 0.002, mode: "duck", label: "duck" }], 1000);

    expect(edited[0]).toBeCloseTo(0.25);
    expect(edited[5]).toBe(1);
  });
});
