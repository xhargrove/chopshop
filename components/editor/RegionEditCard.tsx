"use client";

import { DEFAULT_BEATS_PER_BAR, EDITOR_EXTEND_BAR_OPTIONS, EDITOR_TRIM_BAR_OPTIONS, SECONDS_PER_MINUTE } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import type { WaveformRegion } from "@/types/audio";

interface RegionEditCardProps {
  title: string;
  type: "intro" | "outro";
  region: WaveformRegion | null;
  bpm: number | null;
  onSetIn: () => void;
  onSetOut: () => void;
  onClear: () => void;
  onExtend: (bars: number) => void;
  onTrim: (bars: number) => void;
}

const getDurationSeconds = (region: WaveformRegion | null): number => (region ? Math.max(region.end - region.start, 0) : 0);

const getBarsLabel = (durationSeconds: number, bpm: number | null): string => {
  if (!bpm) {
    return "--";
  }

  return String(Math.round(durationSeconds / (SECONDS_PER_MINUTE / bpm) / DEFAULT_BEATS_PER_BAR));
};

export function RegionEditCard({ title, type, region, bpm, onSetIn, onSetOut, onClear, onExtend, onTrim }: RegionEditCardProps) {
  const durationSeconds = getDurationSeconds(region);
  const requiresBpmTitle = bpm ? undefined : "Enter BPM to use bar-based editing";

  return (
    <section className="flex flex-col gap-4 rounded-dropzone border border-border bg-background p-4" aria-label={`${title} controls`}>
      <h3 className="font-display text-2xl tracking-[0.08em] text-text-primary">{title}</h3>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          onClick={onSetIn}
          aria-label={`Set ${type} in point`}
        >
          Set In
        </button>
        <button
          type="button"
          className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          onClick={onSetOut}
          aria-label={`Set ${type} out point`}
        >
          Set Out
        </button>
        <button
          type="button"
          className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          onClick={onClear}
          aria-label={`Clear ${type} region`}
        >
          Clear
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-3 font-mono text-sm text-text-muted">
        <div>
          <dt>Duration</dt>
          <dd className="text-text-primary">{formatDuration(durationSeconds)}</dd>
        </div>
        <div>
          <dt>Bars</dt>
          <dd className="text-text-primary">{getBarsLabel(durationSeconds, bpm)}</dd>
        </div>
      </dl>
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Extend</p>
        <div className="flex flex-wrap gap-2">
          {EDITOR_EXTEND_BAR_OPTIONS.map((bars) => (
            <button
              key={bars}
              type="button"
              className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs text-text-primary disabled:cursor-not-allowed disabled:text-text-muted"
              onClick={() => onExtend(bars)}
              disabled={!bpm || !region}
              title={requiresBpmTitle}
              aria-label={`Extend ${type} by ${bars} bars`}
            >
              {bars > 0 ? `+${bars}` : bars} bars
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Trim</p>
        <div className="flex flex-wrap gap-2">
          {EDITOR_TRIM_BAR_OPTIONS.map((bars) => (
            <button
              key={bars}
              type="button"
              className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs text-text-primary disabled:cursor-not-allowed disabled:text-text-muted"
              onClick={() => onTrim(bars)}
              disabled={!bpm || !region}
              title={requiresBpmTitle}
              aria-label={`Trim ${type} to ${bars} bars`}
            >
              {bars} bars
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
