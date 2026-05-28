"use client";

import { BeatOffsetControl } from "@/components/editor/BeatOffsetControl";
import { HotCuePads } from "@/components/editor/HotCuePads";
import { SmartPrepPanel } from "@/components/editor/SmartPrepPanel";
import { WorkflowPresetBar } from "@/components/editor/WorkflowPresetBar";
import { formatTime } from "@/lib/format";
import type { AudioSession, WaveformRegion, WorkflowPresetId } from "@/types/audio";

interface PreparePanelProps {
  session: AudioSession;
  currentTime: number;
  activeHotkeySlot: number;
  snapDivision: 1 | 2 | 4 | null;
  loopRegion: WaveformRegion | undefined;
  onSelectSlot: (hotkey: number) => void;
  onSetCueAtPlayhead: (hotkey: number) => void;
  onJumpToCue: (hotkey: number) => void;
  onClearCue: (hotkey: number) => void;
  onSnapDivisionChange: (division: 1 | 2 | 4 | null) => void;
  onLoopIn: () => void;
  onLoopOut: () => void;
  onClearLoop: () => void;
  onManualBpm: (bpm: number) => void;
  onResetBpm: () => void;
  onBeatOffsetChange: (offsetSeconds: number) => void;
  activeWorkflowPreset: WorkflowPresetId | null;
  lastAutosaveAt: number | null;
  onApplyWorkflowPreset: (presetId: WorkflowPresetId) => void;
  onApplySmartPrep: () => void;
}

const SNAP_OPTIONS: Array<{ value: 1 | 2 | 4 | null; label: string }> = [
  { value: null, label: "Off" },
  { value: 4, label: "1/4" },
  { value: 2, label: "1/2" },
  { value: 1, label: "Bar" },
];

export function PreparePanel({
  session,
  currentTime,
  activeHotkeySlot,
  snapDivision,
  loopRegion,
  onSelectSlot,
  onSetCueAtPlayhead,
  onJumpToCue,
  onClearCue,
  onSnapDivisionChange,
  onLoopIn,
  onLoopOut,
  onClearLoop,
  onManualBpm,
  onResetBpm,
  onBeatOffsetChange,
  activeWorkflowPreset,
  lastAutosaveAt,
  onApplyWorkflowPreset,
  onApplySmartPrep,
}: PreparePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <WorkflowPresetBar activePresetId={activeWorkflowPreset} onApplyPreset={onApplyWorkflowPreset} />
      <SmartPrepPanel session={session} onApply={onApplySmartPrep} />
      <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Prepare mode">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl tracking-[0.08em] text-text-primary">Prepare</h2>
            <p className="mt-1 font-mono text-xs text-text-muted">
              Pads: click jump · empty sets at playhead · Shift+click clear · auto-advances slot. Keys 1–8 jump, Shift+1–8 set.
            </p>
            {lastAutosaveAt ? (
              <p className="mt-1 font-mono text-[10px] text-text-muted">Autosaved {new Date(lastAutosaveAt).toLocaleTimeString()}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Snap to grid">
            {SNAP_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`rounded-dropzone border px-2 py-1 font-mono text-xs uppercase tracking-[0.12em] ${
                  snapDivision === option.value ? "border-accent text-accent" : "border-border text-text-muted"
                }`}
                onClick={() => onSnapDivisionChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <HotCuePads
          cuePoints={session.cuePoints}
          activeHotkeySlot={activeHotkeySlot}
          currentTime={currentTime}
          onSelectSlot={onSelectSlot}
          onSetAtPlayhead={onSetCueAtPlayhead}
          onJumpToCue={onJumpToCue}
          onClearCue={onClearCue}
        />
      </section>

      <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Loop markers">
        <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-text-muted">Loop</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] hover:border-accent"
            onClick={onLoopIn}
          >
            Loop in
          </button>
          <button
            type="button"
            className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] hover:border-accent"
            onClick={onLoopOut}
          >
            Loop out
          </button>
          {loopRegion ? (
            <button
              type="button"
              className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] text-text-muted hover:border-accent"
              onClick={onClearLoop}
            >
              Clear loop
            </button>
          ) : null}
        </div>
        {loopRegion ? (
          <p className="mt-2 font-mono text-xs text-text-muted">
            {formatTime(loopRegion.start)} → {formatTime(loopRegion.end)}
          </p>
        ) : (
          <p className="mt-2 font-mono text-xs text-text-muted">Shift+I loop in · Shift+O loop out at playhead</p>
        )}
      </section>

      <BeatOffsetControl
        currentTime={currentTime}
        bpm={session.file.bpm}
        autoBpm={session.autoBpm}
        beatOffset={session.file.beatOffset}
        bpmSource={session.bpmSource}
        onManualBpm={onManualBpm}
        onResetBpm={onResetBpm}
        onBeatOffsetChange={onBeatOffsetChange}
      />
    </div>
  );
}
