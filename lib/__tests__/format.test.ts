import { describe, expect, it } from "vitest";

import { BYTES_PER_KILOBYTE, BYTES_PER_MEGABYTE } from "@/lib/constants";
import { formatBPM, formatDuration, formatFileSize, formatKey, formatTime } from "@/lib/format";

describe("formatDuration", () => {
  it("formats region durations with millisecond precision", () => {
    expect(formatDuration(16)).toBe("0:16.000");
  });

  it("pads seconds below ten", () => {
    expect(formatDuration(4.25)).toBe("0:04.250");
  });

  it("clamps negative durations to zero", () => {
    expect(formatDuration(-2)).toBe("0:00.000");
  });
});

describe("formatTime", () => {
  it("formats playhead time under an hour", () => {
    expect(formatTime(62)).toBe("1:02");
  });

  it("formats playhead time over an hour", () => {
    expect(formatTime(3750)).toBe("1:02:30");
  });
});

describe("formatBPM", () => {
  it("formats BPM with two decimals", () => {
    expect(formatBPM(128)).toBe("128.00 BPM");
  });
});

describe("formatKey", () => {
  it("normalizes Camelot keys", () => {
    expect(formatKey(" 8a ")).toBe("8A");
  });
});

describe("formatFileSize", () => {
  it("formats exact megabytes without decimals", () => {
    expect(formatFileSize(200 * BYTES_PER_MEGABYTE)).toBe("200 MB");
  });

  it("formats fractional megabytes with one decimal", () => {
    expect(formatFileSize(14.3 * BYTES_PER_MEGABYTE)).toBe("14.3 MB");
  });

  it("formats kilobytes below one megabyte", () => {
    expect(formatFileSize(BYTES_PER_KILOBYTE)).toBe("1 KB");
  });
});
