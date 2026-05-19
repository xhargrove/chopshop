"use client";

import { useCallback, type ChangeEvent } from "react";

import { RegionEditCard } from "@/components/editor/RegionEditCard";
import type { WaveformRegion } from "@/types/audio";

interface IntroOutroPanelProps {
  regions: WaveformRegion[];
  currentTime: number;
  bpm: number | null;
  snapDivision: 1 | 2 | 4 | null;
  onBpmChange: (bpm: number | null) => void;
  onSnapDivisionChange: (division: 1 | 2 | 4 | null) => void;
  onSetBoundary: (type: WaveformRegion["type"], boundary: "start" | "end", position: number) => void;
  onClearRegion: (type: WaveformRegion["type"]) => void;
  onExtendRegion: (type: WaveformRegion["type"], bars: number) => void;
  onTrimRegion: (type: WaveformRegion["type"], bars: number) => void;
}

const snapOptions = [
  { label: "OFF", value: "" },
  { label: "1/4", value: "4" },
  { label: "1/2", value: "2" },
  { label: "1 BAR", value: "1" },
] as const;

const parseSnapDivision = (value: string): 1 | 2 | 4 | null => {
  if (value === "1") {
    return 1;
  }

  if (value === "2") {
    return 2;
  }

  if (value === "4") {
    return 4;
  }

  return null;
};

export function IntroOutroPanel({
  regions,
  currentTime,
  bpm,
  snapDivision,
  onBpmChange,
  onSnapDivisionChange,
  onSetBoundary,
  onClearRegion,
  onExtendRegion,
  onTrimRegion,
}: IntroOutroPanelProps) {
  const introRegion = regions.find((region) => region.type === "intro") ?? null;
  const outroRegion = regions.find((region) => region.type === "outro") ?? null;

  const handleBpmChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const nextValue = Number(event.target.value);
      onBpmChange(Number.isFinite(nextValue) && nextValue > 0 ? nextValue : null);
    },
    [onBpmChange],
  );

  return (
    <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Intro and outro editor">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-[0.08em] text-text-primary">Intro / Outro Editor</h2>
          <p className="font-body text-sm text-text-muted">Set edit regions, then trim or extend them against the beat grid.</p>
        </div>
        <label className="flex flex-col gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          BPM
          <input
            className="w-32 rounded-dropzone border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            type="number"
            min="1"
            value={bpm ?? ""}
            onChange={handleBpmChange}
            aria-label="Manual BPM value"
          />
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RegionEditCard
          title="INTRO EDIT"
          type="intro"
          region={introRegion}
          bpm={bpm}
          onSetIn={() => onSetBoundary("intro", "start", currentTime)}
          onSetOut={() => onSetBoundary("intro", "end", currentTime)}
          onClear={() => onClearRegion("intro")}
          onExtend={(bars) => onExtendRegion("intro", bars)}
          onTrim={(bars) => onTrimRegion("intro", bars)}
        />
        <RegionEditCard
          title="OUTRO EDIT"
          type="outro"
          region={outroRegion}
          bpm={bpm}
          onSetIn={() => onSetBoundary("outro", "start", currentTime)}
          onSetOut={() => onSetBoundary("outro", "end", currentTime)}
          onClear={() => onClearRegion("outro")}
          onExtend={(bars) => onExtendRegion("outro", bars)}
          onTrim={(bars) => onTrimRegion("outro", bars)}
        />
      </div>
      <fieldset className="mt-5 rounded-dropzone border border-border p-3">
        <legend className="px-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Snap to beat</legend>
        <div className="flex flex-wrap gap-2">
          {snapOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              className={`rounded-dropzone border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] ${
                String(snapDivision ?? "") === option.value ? "border-accent text-accent" : "border-border text-text-primary"
              }`}
              onClick={() => onSnapDivisionChange(parseSnapDivision(option.value))}
              aria-label={`Set snap to ${option.label}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
