"use client";

import { WORKFLOW_PRESETS } from "@/lib/workflowPresets";
import type { WorkflowPresetId } from "@/types/audio";

interface WorkflowPresetBarProps {
  activePresetId: WorkflowPresetId | null;
  onApplyPreset: (presetId: WorkflowPresetId) => void;
}

export function WorkflowPresetBar({ activePresetId, onApplyPreset }: WorkflowPresetBarProps) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Workflow presets">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">Workflow</p>
      <div className="flex flex-wrap gap-2">
        {WORKFLOW_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={preset.description}
            className={`rounded-dropzone border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${
              activePresetId === preset.id ? "border-accent text-accent" : "border-border text-text-muted hover:border-text-muted"
            }`}
            onClick={() => onApplyPreset(preset.id)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
