import { DEFAULT_BEATS_PER_BAR, DEFAULT_TRANSITION_BEATS, MAX_HOTKEY_CUE_POINTS } from "@/lib/constants";
import { snapToBeat } from "@/lib/regions";
import type { AudioSession, BleepRegion, CuePoint, TransitionCue, WaveformRegion } from "@/types/audio";

export interface SmartPrepSuggestion {
  id: string;
  kind: "cue" | "region" | "transition" | "bleep";
  label: string;
  confidence: number;
  reason: string;
}

export interface SmartPrepDraft {
  cuePoints: CuePoint[];
  regions: WaveformRegion[];
  transitionCues: TransitionCue[];
  bleepRegions: BleepRegion[];
  suggestions: SmartPrepSuggestion[];
}

const beatDuration = (bpm: number): number => (60 / bpm) * DEFAULT_BEATS_PER_BAR;

const snapTime = (seconds: number, bpm: number | null): number =>
  bpm ? snapToBeat(seconds, bpm, 4) : Number(seconds.toFixed(3));

const buildCue = (hotkey: number, position: number, label: string, color: string): CuePoint => ({
  id: `smart-cue-${hotkey}`,
  position,
  label,
  color,
  hotkey,
});

export const generateSmartPrepDraft = (session: AudioSession): SmartPrepDraft => {
  const duration = session.file.durationSeconds;
  const bpm = session.file.bpm ?? session.autoBpm;
  const suggestions: SmartPrepSuggestion[] = [];
  const cuePoints: CuePoint[] = [];
  const regions: WaveformRegion[] = [];
  const transitionCues: TransitionCue[] = [];
  const bleepRegions: BleepRegion[] = [];

  const startCue = snapTime(0, bpm);
  cuePoints.push(buildCue(1, startCue, "Start", "#FF3D00"));
  suggestions.push({ id: "cue-start", kind: "cue", label: "Start cue", confidence: 0.95, reason: "Track entry" });

  if (bpm) {
    const phrase = beatDuration(bpm) * 8;
    const drop = snapTime(Math.min(phrase * 2, duration * 0.35), bpm);
    const breakdown = snapTime(Math.min(phrase * 4, duration * 0.55), bpm);
    const lift = snapTime(Math.min(phrase * 6, duration * 0.75), bpm);

    cuePoints.push(buildCue(2, drop, "Drop", "#00E5FF"));
    suggestions.push({ id: "cue-drop", kind: "cue", label: "Drop", confidence: 0.7, reason: "Phrase-aligned energy point" });

    if (duration > phrase * 3) {
      cuePoints.push(buildCue(3, breakdown, "Break", "#69FF47"));
      suggestions.push({ id: "cue-break", kind: "cue", label: "Breakdown", confidence: 0.6, reason: "Mid-track phrase" });
    }

    if (duration > phrase * 5) {
      cuePoints.push(buildCue(4, lift, "Lift", "#FFD600"));
      suggestions.push({ id: "cue-lift", kind: "cue", label: "Lift", confidence: 0.55, reason: "Late-track phrase" });
    }

    const introBars = 16;
    const outroBars = 16;
    const introEnd = snapTime(Math.min((60 / bpm) * DEFAULT_BEATS_PER_BAR * introBars, duration * 0.25), bpm);
    const outroStart = snapTime(Math.max(duration - (60 / bpm) * DEFAULT_BEATS_PER_BAR * outroBars, duration * 0.75), bpm);

    regions.push({
      id: "smart-intro",
      start: 0,
      end: introEnd,
      type: "intro",
      color: "#FF3D00",
      label: "Intro",
    });
    suggestions.push({ id: "region-intro", kind: "region", label: "Intro region", confidence: 0.75, reason: `${introBars}-bar intro heuristic` });

    regions.push({
      id: "smart-outro",
      start: outroStart,
      end: duration,
      type: "outro",
      color: "#00E5FF",
      label: "Outro",
    });
    suggestions.push({ id: "region-outro", kind: "region", label: "Outro region", confidence: 0.75, reason: `${outroBars}-bar outro heuristic` });

    const mixInWindow = (DEFAULT_TRANSITION_BEATS / bpm) * 60;
    transitionCues.push({
      id: "smart-mix-in",
      position: introEnd,
      windowSeconds: mixInWindow,
      inPoint: Math.max(introEnd - mixInWindow, 0),
      outPoint: introEnd,
      type: "mix-in",
      label: "Smart mix in",
    });
    suggestions.push({ id: "transition-in", kind: "transition", label: "Mix in", confidence: 0.65, reason: "After intro region" });

    transitionCues.push({
      id: "smart-mix-out",
      position: outroStart,
      windowSeconds: mixInWindow,
      inPoint: outroStart,
      outPoint: Math.min(outroStart + mixInWindow, duration),
      type: "mix-out",
      label: "Smart mix out",
    });
    suggestions.push({ id: "transition-out", kind: "transition", label: "Mix out", confidence: 0.65, reason: "Before outro region" });
  } else {
    const introEnd = duration * 0.2;
    const outroStart = duration * 0.8;
    regions.push({ id: "smart-intro", start: 0, end: introEnd, type: "intro", color: "#FF3D00", label: "Intro" });
    regions.push({ id: "smart-outro", start: outroStart, end: duration, type: "outro", color: "#00E5FF", label: "Outro" });
    suggestions.push(
      { id: "region-intro", kind: "region", label: "Intro region", confidence: 0.5, reason: "Time-based (no BPM)" },
      { id: "region-outro", kind: "region", label: "Outro region", confidence: 0.5, reason: "Time-based (no BPM)" },
    );
  }

  const endCue = snapTime(Math.max(duration - 0.05, 0), bpm);
  if (cuePoints.length < MAX_HOTKEY_CUE_POINTS) {
    cuePoints.push(buildCue(Math.min(cuePoints.length + 1, MAX_HOTKEY_CUE_POINTS), endCue, "End", "#B388FF"));
    suggestions.push({ id: "cue-end", kind: "cue", label: "End cue", confidence: 0.9, reason: "Track tail" });
  }

  return { cuePoints, regions, transitionCues, bleepRegions, suggestions };
};

/** Merges draft cues/regions without overwriting existing hotkey slots or region types. */
export const mergeSmartPrepDraft = (session: AudioSession, draft: SmartPrepDraft): AudioSession => {
  const usedHotkeys = new Set(session.cuePoints.map((cue) => cue.hotkey).filter((hotkey): hotkey is number => hotkey !== null));
  const mergedCues = [...session.cuePoints];

  draft.cuePoints.forEach((cue) => {
    if (cue.hotkey === null || usedHotkeys.has(cue.hotkey)) {
      return;
    }

    mergedCues.push({ ...cue, id: `${cue.id}-${Date.now()}` });
    usedHotkeys.add(cue.hotkey);
  });

  const regionTypes = new Set(session.regions.map((region) => region.type));
  const mergedRegions = [
    ...session.regions,
    ...draft.regions.filter((region) => !regionTypes.has(region.type)).map((region) => ({ ...region, id: `${region.id}-${Date.now()}` })),
  ];

  return {
    ...session,
    cuePoints: mergedCues,
    regions: mergedRegions,
    transitionCues: session.transitionCues.length > 0 ? session.transitionCues : draft.transitionCues,
    bleepRegions: session.bleepRegions.length > 0 ? session.bleepRegions : draft.bleepRegions,
  };
};
