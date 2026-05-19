"use client";

import { useCallback, useRef, type ChangeEvent } from "react";

import { BEAT_GRID_TAP_RESET_MS, BEAT_OFFSET_NUDGE_SECONDS, BPM_INPUT_STEP, MAX_BPM, MIN_BPM, MILLISECONDS_PER_SECOND, SECONDS_PER_MINUTE } from "@/lib/constants";
import { formatBPM } from "@/lib/format";
import type { MetadataSource } from "@/types/audio";

interface BeatOffsetControlProps {
  currentTime: number;
  bpm: number | null;
  autoBpm: number | null;
  beatOffset: number;
  bpmSource: MetadataSource | null;
  onManualBpm: (bpm: number) => void;
  onResetBpm: () => void;
  onBeatOffsetChange: (offsetSeconds: number) => void;
}

const formatOffset = (offsetSeconds: number): string => `${offsetSeconds >= 0 ? "+" : ""}${offsetSeconds.toFixed(3)}s`;

export function BeatOffsetControl({
  currentTime,
  bpm,
  autoBpm,
  beatOffset,
  bpmSource,
  onManualBpm,
  onResetBpm,
  onBeatOffsetChange,
}: BeatOffsetControlProps) {
  const tapTimesRef = useRef<number[]>([]);

  const handleTapTempo = useCallback((): void => {
    const now = performance.now();
    const taps = [...tapTimesRef.current.filter((tapTime) => now - tapTime <= BEAT_GRID_TAP_RESET_MS), now];
    tapTimesRef.current = taps;

    if (taps.length < 2) {
      return;
    }

    const intervals = taps.slice(1).map((tapTime, index) => (tapTime - taps[index]) / MILLISECONDS_PER_SECOND);
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    onManualBpm(SECONDS_PER_MINUTE / averageInterval);
  }, [onManualBpm]);

  const handleBpmChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const nextBpm = Number(event.target.value);

      if (Number.isFinite(nextBpm)) {
        onManualBpm(nextBpm);
      }
    },
    [onManualBpm],
  );

  return (
    <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Beat grid alignment controls">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl tracking-[0.08em] text-text-primary">Beat Grid</h2>
        {bpmSource === "manual" ? <span className="rounded border border-accent px-2 py-1 font-mono text-xs text-accent">MANUAL</span> : null}
        <span className="font-mono text-sm text-text-muted">{bpm ? formatBPM(bpm) : "BPM pending"}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Manual BPM
          <input
            className="rounded-dropzone border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            type="number"
            min={MIN_BPM}
            max={MAX_BPM}
            step={BPM_INPUT_STEP}
            value={bpm ?? ""}
            onChange={handleBpmChange}
            aria-label="Manual BPM override"
          />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button type="button" className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs" onClick={handleTapTempo} aria-label="Tap tempo">
            Tap Tempo
          </button>
          <button type="button" className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs" onClick={onResetBpm} disabled={!autoBpm} aria-label="Reset BPM to auto detected value">
            Reset to Auto
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-sm text-text-muted">
        <span>Offset {formatOffset(beatOffset)}</span>
        <button type="button" className="rounded-dropzone border border-border px-3 py-2 text-xs" onClick={() => onBeatOffsetChange(currentTime)} aria-label="Set downbeat at current playhead">
          Set Downbeat Here
        </button>
        <button type="button" className="rounded-dropzone border border-border px-3 py-2 text-xs" onClick={() => onBeatOffsetChange(beatOffset - BEAT_OFFSET_NUDGE_SECONDS)} aria-label="Move beat offset earlier by 10 milliseconds">
          -10ms
        </button>
        <button type="button" className="rounded-dropzone border border-border px-3 py-2 text-xs" onClick={() => onBeatOffsetChange(beatOffset + BEAT_OFFSET_NUDGE_SECONDS)} aria-label="Move beat offset later by 10 milliseconds">
          +10ms
        </button>
      </div>
    </section>
  );
}
