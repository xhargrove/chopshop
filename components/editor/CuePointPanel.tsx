"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { CUE_COLORS, CUE_COLOR_DOT_CLASSES, EMPTY_SELECTION, MAX_HOTKEY_CUE_POINTS } from "@/lib/constants";
import { formatTime } from "@/lib/format";
import type { CuePoint } from "@/types/audio";

interface CuePointPanelProps {
  cuePoints: CuePoint[];
  activeCueId: string | null;
  renameCueId: string | null;
  currentTime: number;
  onRenameHandled: () => void;
  onAddCue: (position: number) => void;
  onSelectCue: (cueId: string) => void;
  onSeek: (position: number) => void;
  onRenameCue: (cueId: string, label: string) => void;
}

const getCueDotClass = (color: string): string => {
  const cueColorIndex = CUE_COLORS.findIndex((candidate) => candidate === color);
  return CUE_COLOR_DOT_CLASSES[cueColorIndex] ?? CUE_COLOR_DOT_CLASSES[0];
};

export function CuePointPanel({
  cuePoints,
  activeCueId,
  renameCueId,
  currentTime,
  onRenameHandled,
  onAddCue,
  onSelectCue,
  onSeek,
  onRenameCue,
}: CuePointPanelProps) {
  const [editingCueId, setEditingCueId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState(EMPTY_SELECTION);

  const startRename = useCallback((cuePoint: CuePoint): void => {
    setEditingCueId(cuePoint.id);
    setDraftLabel(cuePoint.label);
  }, []);

  useEffect(() => {
    const cuePoint = cuePoints.find((candidate) => candidate.id === renameCueId);

    if (cuePoint) {
      startRename(cuePoint);
      onRenameHandled();
    }
  }, [cuePoints, onRenameHandled, renameCueId, startRename]);

  const commitRename = useCallback((): void => {
    if (editingCueId && draftLabel.trim()) {
      onRenameCue(editingCueId, draftLabel.trim());
    }

    setEditingCueId(null);
    setDraftLabel(EMPTY_SELECTION);
  }, [draftLabel, editingCueId, onRenameCue]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      const hotkey = Number(event.key);

      if (!Number.isInteger(hotkey) || hotkey < 1 || hotkey > MAX_HOTKEY_CUE_POINTS) {
        return;
      }

      const cuePoint = cuePoints.find((candidate) => candidate.hotkey === hotkey);

      if (cuePoint) {
        event.preventDefault();
        onSelectCue(cuePoint.id);
        onSeek(cuePoint.position);
      }
    },
    [cuePoints, onSeek, onSelectCue],
  );

  return (
    <section
      className="rounded-dropzone border border-border bg-surface p-4"
      aria-label="Cue points"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-3xl tracking-[0.08em] text-text-primary">Cue Points</h2>
        <button
          type="button"
          className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          onClick={() => onAddCue(currentTime)}
          aria-label="Add cue point at current playhead"
        >
          + Add
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        {cuePoints.map((cuePoint) => (
          <button
            key={cuePoint.id}
            type="button"
            className={`min-w-20 rounded-dropzone border p-3 text-left focus:outline-none focus:ring-2 focus:ring-accent ${
              cuePoint.id === activeCueId ? "border-accent" : "border-border"
            }`}
            onClick={() => {
              onSelectCue(cuePoint.id);
              onSeek(cuePoint.position);
            }}
            onDoubleClick={() => startRename(cuePoint)}
            aria-label={`Seek to cue point ${cuePoint.label}`}
          >
            <span className="mb-2 flex items-center gap-2 font-mono text-xs text-text-muted">
              <span className={`h-2 w-2 rounded-full ${getCueDotClass(cuePoint.color)}`} aria-hidden="true" />
              {cuePoint.hotkey ?? "--"}
            </span>
            {editingCueId === cuePoint.id ? (
              <input
                className="mb-2 w-full rounded border border-border bg-background px-2 py-1 font-body text-sm text-text-primary"
                value={draftLabel}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftLabel(event.target.value)}
                onBlur={commitRename}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitRename();
                  }
                }}
                aria-label="Rename cue point"
              />
            ) : (
              <span className="block truncate font-body text-sm text-text-primary">{cuePoint.label}</span>
            )}
            <span className="font-mono text-xs text-text-muted">{formatTime(cuePoint.position)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
