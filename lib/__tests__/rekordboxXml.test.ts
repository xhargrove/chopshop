/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";

import { generateRekordboxXml } from "@/lib/export/rekordboxXml";
import type { AudioSession } from "@/types/audio";

const session = {
  file: {
    id: "file",
    name: "track.wav",
    format: "wav",
    sizeBytes: 1,
    durationSeconds: 90,
    bpm: 124,
    key: "9A",
    beatOffset: 0,
    url: "blob:test",
    sourceFile: new File(["test"], "track.wav", { type: "audio/wav" }),
    createdAt: 0,
  },
  regions: [{ id: "loop", start: 12, end: 24, type: "loop", color: "#69FF47", label: "Loop" }],
  cuePoints: [{ id: "cue", position: 1.5, label: "Cue 1", color: "#FF3D00", hotkey: 1 }],
  bleepRegions: [],
  transitionCues: [{ id: "mix", position: 30, windowSeconds: 4, inPoint: 26, outPoint: 30, type: "mix-in", label: "Mix in" }],
  acapellaSwap: null,
  playheadPosition: 0,
  isPlaying: false,
  zoom: 1,
  bpmSource: "manual",
  keySource: "manual",
  autoBpm: null,
  autoKey: null,
} satisfies AudioSession;

describe("rekordboxXml", () => {
  it("includes cue, loop, and transition position marks", () => {
    const xml = generateRekordboxXml(session);

    expect(xml).toContain("POSITION_MARK");
    expect(xml).toContain('Start="1.500"');
    expect(xml).toContain('Start="12.000"');
    expect(xml).toContain('End="24.000"');
    expect(xml).toContain("Mix in");
  });
});
