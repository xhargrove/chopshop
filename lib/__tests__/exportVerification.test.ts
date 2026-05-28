/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";

import { verifySessionExports } from "@/lib/exportVerification";
import type { AudioSession } from "@/types/audio";

const session = {
  file: {
    id: "file",
    name: "track.wav",
    format: "wav",
    sizeBytes: 1,
    durationSeconds: 60,
    bpm: 128,
    key: "8A",
    beatOffset: 0,
    url: "blob:test",
    sourceFile: new File(["test"], "track.wav", { type: "audio/wav" }),
    createdAt: 0,
  },
  regions: [{ id: "loop", start: 10, end: 20, type: "loop", color: "#69FF47", label: "Loop" }],
  cuePoints: [{ id: "cue", position: 5, label: "Drop", color: "#FF3D00", hotkey: 1 }],
  bleepRegions: [],
  transitionCues: [],
  acapellaSwap: null,
  playheadPosition: 0,
  isPlaying: false,
  zoom: 1,
  bpmSource: "manual",
  keySource: "manual",
  autoBpm: null,
  autoKey: null,
} satisfies AudioSession;

describe("exportVerification", () => {
  it("passes when cue and loop metadata align", () => {
    const report = verifySessionExports(session);

    expect(report.passed).toBe(true);
    expect(report.checks.some((check) => check.id === "serato-loop" && check.passed)).toBe(true);
  });

  it("fails when a cue is out of range", () => {
    const invalid = {
      ...session,
      cuePoints: [{ id: "cue", position: 120, label: "Bad", color: "#FF3D00", hotkey: 1 }],
    };
    const report = verifySessionExports(invalid);

    expect(report.passed).toBe(false);
  });
});
