import { describe, expect, it } from "vitest";

import { generateSmartPrepDraft, mergeSmartPrepDraft } from "@/lib/smartPrep";
import type { AudioSession } from "@/types/audio";

const baseSession = {
  file: {
    id: "file",
    name: "track.wav",
    format: "wav",
    sizeBytes: 1,
    durationSeconds: 120,
    bpm: 128,
    key: "8A",
    beatOffset: 0,
    url: "blob:test",
    sourceFile: new File(["test"], "track.wav", { type: "audio/wav" }),
    createdAt: 0,
  },
  regions: [],
  cuePoints: [{ id: "existing", position: 10, label: "Cue 1", color: "#FF3D00", hotkey: 1 }],
  bleepRegions: [],
  transitionCues: [],
  acapellaSwap: null,
  playheadPosition: 0,
  isPlaying: false,
  zoom: 1,
  bpmSource: "manual",
  keySource: "manual",
  autoBpm: 128,
  autoKey: "8A",
} satisfies AudioSession;

describe("smartPrep", () => {
  it("generates phrase-aligned draft suggestions", () => {
    const draft = generateSmartPrepDraft(baseSession);

    expect(draft.cuePoints.length).toBeGreaterThan(1);
    expect(draft.regions.some((region) => region.type === "intro")).toBe(true);
    expect(draft.suggestions.length).toBeGreaterThan(0);
  });

  it("does not overwrite occupied hotkey slots", () => {
    const draft = generateSmartPrepDraft(baseSession);
    const merged = mergeSmartPrepDraft(baseSession, draft);

    expect(merged.cuePoints.filter((cue) => cue.hotkey === 1)).toHaveLength(1);
    expect(merged.cuePoints.length).toBeGreaterThan(baseSession.cuePoints.length);
  });
});
