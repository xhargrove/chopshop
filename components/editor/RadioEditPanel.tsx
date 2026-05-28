"use client";

import { useState } from "react";

import type { AudioSession, BleepMode, BleepRegion } from "@/types/audio";

interface RadioEditPanelProps {
  session: AudioSession;
  currentTime: number;
  onAddRegion: (start: number, end: number, mode: BleepMode) => void;
  onRemoveRegion: (id: string) => void;
}

const MODES: BleepMode[] = ["bleep", "mute", "duck"];

export function RadioEditPanel({ session, currentTime, onAddRegion, onRemoveRegion }: RadioEditPanelProps) {
  const [mode, setMode] = useState<BleepMode>("bleep");
  const [durationSeconds, setDurationSeconds] = useState(2);

  const handleAddAtPlayhead = (): void => {
    const start = Math.max(currentTime - durationSeconds / 2, 0);
    const end = Math.min(start + durationSeconds, session.file.durationSeconds);
    onAddRegion(start, end, mode);
  };

  return (
    <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Radio edit controls">
      <h2 className="mb-4 font-display text-2xl tracking-[0.08em] text-text-primary">Radio Edit</h2>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Mode
          <select className="rounded-dropzone border border-border bg-background px-3 py-2 text-text-primary" value={mode} onChange={(event) => setMode(event.target.value as BleepMode)}>
            {MODES.map((candidate) => (
              <option key={candidate} value={candidate}>
                {candidate}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Duration (s)
          <input
            type="number"
            min={0.25}
            max={30}
            step={0.25}
            className="rounded-dropzone border border-border bg-background px-3 py-2 text-text-primary"
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(Number(event.target.value))}
          />
        </label>
        <button type="button" className="rounded-dropzone border border-accent px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-accent" onClick={handleAddAtPlayhead}>
          Add at playhead
        </button>
      </div>
      <ul className="space-y-2" aria-label="Bleep regions">
        {session.bleepRegions.map((region: BleepRegion) => (
          <li key={region.id} className="flex items-center justify-between rounded-dropzone border border-border px-3 py-2 font-mono text-sm">
            <span>
              {region.label} · {region.mode} · {region.start.toFixed(2)}s–{region.end.toFixed(2)}s
            </span>
            <button type="button" className="text-text-muted" onClick={() => onRemoveRegion(region.id)} aria-label={`Remove ${region.label}`}>
              ✕
            </button>
          </li>
        ))}
        {session.bleepRegions.length === 0 ? <li className="font-mono text-sm text-text-muted">No clean regions yet.</li> : null}
      </ul>
    </section>
  );
}
