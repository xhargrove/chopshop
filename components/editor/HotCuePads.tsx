"use client";

import { CUE_COLOR_DOT_CLASSES, MAX_HOTKEY_CUE_POINTS } from "@/lib/constants";
import { formatTime } from "@/lib/format";
import type { CuePoint } from "@/types/audio";

interface HotCuePadsProps {
  cuePoints: CuePoint[];
  activeHotkeySlot: number;
  currentTime: number;
  onSelectSlot: (hotkey: number) => void;
  onSetAtPlayhead: (hotkey: number) => void;
  onJumpToCue: (hotkey: number) => void;
  onClearCue: (hotkey: number) => void;
}

const getCueForSlot = (cuePoints: CuePoint[], hotkey: number): CuePoint | undefined =>
  cuePoints.find((cuePoint) => cuePoint.hotkey === hotkey);

export function HotCuePads({
  cuePoints,
  activeHotkeySlot,
  currentTime,
  onSelectSlot,
  onSetAtPlayhead,
  onJumpToCue,
  onClearCue,
}: HotCuePadsProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8" role="group" aria-label="Hot cue pads">
      {Array.from({ length: MAX_HOTKEY_CUE_POINTS }, (_, index) => {
        const hotkey = index + 1;
        const cuePoint = getCueForSlot(cuePoints, hotkey);
        const isActive = activeHotkeySlot === hotkey;
        const dotClass = CUE_COLOR_DOT_CLASSES[index];

        return (
          <button
            key={hotkey}
            type="button"
            className={`flex min-h-[4.5rem] flex-col rounded-dropzone border p-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
              isActive ? "border-accent bg-background" : "border-border bg-surface hover:border-text-muted"
            }`}
            aria-label={cuePoint ? `Hot cue ${hotkey}, ${cuePoint.label}` : `Hot cue ${hotkey}, empty`}
            aria-pressed={isActive}
            onClick={(event) => {
              onSelectSlot(hotkey);

              if (event.shiftKey) {
                if (cuePoint) {
                  onClearCue(hotkey);
                }
                return;
              }

              if (cuePoint) {
                onJumpToCue(hotkey);
                return;
              }

              onSetAtPlayhead(hotkey);
            }}
            onDoubleClick={(event) => {
              event.preventDefault();
              onSetAtPlayhead(hotkey);
            }}
          >
            <span className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
              <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden="true" />
              {hotkey}
            </span>
            <span className="truncate font-body text-xs text-text-primary">{cuePoint?.label ?? "—"}</span>
            <span className="mt-auto font-mono text-[10px] text-text-muted">
              {cuePoint ? formatTime(cuePoint.position) : formatTime(currentTime)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
