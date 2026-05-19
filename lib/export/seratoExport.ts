import type { AudioSession } from "@/types/audio";

export interface SeratoCueExport {
  version: "1.0";
  track: {
    name: string;
    bpm: number;
    key: string;
  };
  cuePoints: Array<{
    index: number;
    positionMs: number;
    color: string;
    label: string;
  }>;
  transitionCues: Array<{
    type: "mix-in" | "mix-out";
    positionMs: number;
    windowMs: number;
    label: string;
  }>;
  exportedAt: string;
}

export function generateSeratoCueExport(session: AudioSession, exportedAt: string = new Date().toISOString()): SeratoCueExport {
  return {
    version: "1.0",
    track: {
      name: session.file.name,
      bpm: session.file.bpm ?? 0,
      key: session.file.key ?? "",
    },
    cuePoints: session.cuePoints.map((cuePoint, index) => ({
      index: cuePoint.hotkey ?? index + 1,
      positionMs: Math.round(cuePoint.position * 1000),
      color: cuePoint.color,
      label: cuePoint.label,
    })),
    transitionCues: session.transitionCues.map((transitionCue) => ({
      type: transitionCue.type,
      positionMs: Math.round(transitionCue.position * 1000),
      windowMs: Math.round(transitionCue.windowSeconds * 1000),
      label: transitionCue.label,
    })),
    exportedAt,
  };
}
