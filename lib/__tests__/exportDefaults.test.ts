import { describe, expect, it } from "vitest";

import { createExportDefaultsFromPreset } from "@/lib/export/exportDefaults";
import { getWorkflowPreset } from "@/lib/workflowPresets";

describe("exportDefaults", () => {
  it("maps Serato prep preset to Serato export defaults", () => {
    const preset = getWorkflowPreset("serato-prep");

    expect(preset).toBeDefined();
    expect(createExportDefaultsFromPreset(preset!)).toEqual({
      region: "full",
      format: "wav",
      mp3Bitrate: 320,
      includeStems: false,
      exportSerato: true,
      exportRekordbox: false,
    });
  });

  it("maps radio clean preset to dual-format export", () => {
    const preset = getWorkflowPreset("radio-clean");

    expect(preset).toBeDefined();
    expect(createExportDefaultsFromPreset(preset!).format).toBe("both");
    expect(createExportDefaultsFromPreset(preset!).mp3Bitrate).toBe(192);
  });
});
