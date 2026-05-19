import { describe, expect, it } from "vitest";

import { generateSeratoCueExport } from "@/lib/export/seratoExport";
import type { AudioSession } from "@/types/audio";

const session = {
  file: {
    id: "file",
    name: "Summer Anthem.wav",
    format: "wav",
    sizeBytes: 1,
    durationSeconds: 120,
    bpm: 128,
    key: "8A",
    beatOffset: 0,
    url: "blob:test",
    sourceFile: new File(["test"], "Summer Anthem.wav", { type: "audio/wav" }),
    createdAt: 0,
  },
  regions: [],
  cuePoints: [{ id: "cue", position: 1.5, label: "Cue 1", color: "#FF3D00", hotkey: 1 }],
  bleepRegions: [],
  transitionCues: [{ id: "transition", position: 10, windowSeconds: 4, inPoint: 8, outPoint: 12, type: "mix-in", label: "Mix in" }],
  acapellaSwap: null,
  playheadPosition: 0,
  isPlaying: false,
  zoom: 1,
  bpmSource: "manual",
  keySource: "manual",
  autoBpm: null,
  autoKey: null,
} satisfies AudioSession;

describe("Serato export", () => {
  it("exports cue and transition timestamps in milliseconds", () => {
    const exported = generateSeratoCueExport(session, "2026-01-01T00:00:00.000Z");

    expect(exported.cuePoints[0].positionMs).toBe(1500);
    expect(exported.transitionCues[0].windowMs).toBe(4000);
    expect(exported.track.key).toBe("8A");
  });
});
