/**
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import goldenSerato from "@/lib/export/fixtures/golden-serato.json";
import { generateRekordboxXml } from "@/lib/export/rekordboxXml";
import { generateSeratoCueExport } from "@/lib/export/seratoExport";
import { FIXED_EXPORT_TIMESTAMP, normalizeRekordboxXml, normalizeSeratoExport } from "@/lib/export/normalizeExport";
import type { AudioSession } from "@/types/audio";

const fixtureSession = {
  file: {
    id: "file",
    name: "fixture.wav",
    format: "wav",
    sizeBytes: 1,
    durationSeconds: 120,
    bpm: 128,
    key: "8A",
    beatOffset: 0,
    url: "blob:test",
    sourceFile: new File(["test"], "fixture.wav", { type: "audio/wav" }),
    createdAt: 0,
  },
  regions: [{ id: "loop", start: 8, end: 16, type: "loop", color: "#69FF47", label: "Loop" }],
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

describe("export fixtures", () => {
  it("matches golden Serato JSON fixture", () => {
    const exported = normalizeSeratoExport(generateSeratoCueExport(fixtureSession, FIXED_EXPORT_TIMESTAMP));

    expect(exported).toEqual(goldenSerato);
  });

  it("matches golden Rekordbox XML fixture when DOM is available", () => {
    if (typeof DOMParser === "undefined") {
      return;
    }

    const xml = normalizeRekordboxXml(generateRekordboxXml(fixtureSession));
    const goldenPath = resolve(process.cwd(), "lib/export/fixtures/golden-rekordbox.xml");
    const goldenXml = normalizeRekordboxXml(readFileSync(goldenPath, "utf8"));

    expect(xml).toContain('Start="1.500"');
    expect(xml).toContain('Start="8.000"');
    expect(xml).toContain("Mix in");
    expect(xml).toEqual(goldenXml);
  });
});
