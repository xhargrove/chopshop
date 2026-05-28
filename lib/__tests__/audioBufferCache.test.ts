import { describe, expect, it } from "vitest";

import { audioBufferCache, cloneAudioBufferToStereo } from "@/lib/audioBufferCache";
import { buildFileKey } from "@/lib/sessionPersistence";

describe("audioBufferCache", () => {
  it("invalidates cached decode entries", () => {
    audioBufferCache.invalidate();
    expect(audioBufferCache.getEntry()).toBeNull();
  });

  it("builds stable file keys", () => {
    const file = new File(["abc"], "track.wav", { type: "audio/wav", lastModified: 1000 });
    Object.defineProperty(file, "size", { value: 3 });

    expect(buildFileKey(file)).toBe("track.wav|3|1000");
  });
});

describe("cloneAudioBufferToStereo", () => {
  it("interleaves mono buffers", () => {
    const sampleRate = 44100;
    const buffer = {
      sampleRate,
      length: 4,
      duration: 4 / sampleRate,
      numberOfChannels: 1,
      getChannelData: () => new Float32Array([0, 0.25, 0.5, 1]),
    } as unknown as AudioBuffer;

    const interleaved = cloneAudioBufferToStereo(buffer, 0, buffer.duration);

    expect(interleaved).toEqual(new Float32Array([0, 0, 0.25, 0.25, 0.5, 0.5, 1, 1]));
  });
});
