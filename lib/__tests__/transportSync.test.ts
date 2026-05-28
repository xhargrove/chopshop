import { describe, expect, it } from "vitest";

import { clampTransportTime, hasTransportDrift } from "@/lib/transportSync";

describe("transportSync", () => {
  it("detects drift beyond tolerance", () => {
    expect(hasTransportDrift(10, 10.02)).toBe(false);
    expect(hasTransportDrift(10, 10.2)).toBe(true);
  });

  it("clamps transport times to track duration", () => {
    expect(clampTransportTime(-1, 120)).toBe(0);
    expect(clampTransportTime(200, 120)).toBe(120);
  });
});
