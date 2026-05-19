"use client";

import { useCallback } from "react";

import { useStemSeparation } from "@/hooks/useStemSeparation";
import type { StemType } from "@/types/stems";

interface SeparationTriggerProps {
  file: File;
  model: "2stems" | "4stems";
  region?: { start: number; end: number };
  hasStems: boolean;
  onModelChange: (model: "2stems" | "4stems") => void;
  onComplete: (stems: Partial<Record<StemType, AudioBuffer>>) => void;
  onOpenStems: () => void;
}

const modelOptions = ["2stems", "4stems"] as const;

export function SeparationTrigger({ file, model, region, hasStems, onModelChange, onComplete, onOpenStems }: SeparationTriggerProps) {
  const separation = useStemSeparation(onComplete);

  const handleSeparate = useCallback((): void => {
    void separation.separate(file, model, region);
  }, [file, model, region, separation]);

  if (separation.status === "processing" || separation.status === "uploading") {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-dropzone border border-border px-3 py-2 font-mono text-xs text-text-muted">
        <progress className="h-2 w-28 accent-accent" max={100} value={separation.progress} />
        <span>
          Separating... {Math.round(separation.progress)}% {separation.stage}
        </span>
        <button type="button" className="text-accent" onClick={separation.cancel}>
          Cancel
        </button>
      </div>
    );
  }

  if (separation.status === "error") {
    return (
      <button type="button" className="rounded-dropzone border border-accent px-4 py-2 font-mono text-xs uppercase text-accent" onClick={separation.reset}>
        ⚠ Separation failed {separation.error ? `- ${separation.error}` : ""}
      </button>
    );
  }

  if (hasStems || separation.status === "complete") {
    return (
      <button type="button" className="rounded-dropzone border border-border px-4 py-2 font-mono text-xs uppercase text-text-primary" onClick={onOpenStems}>
        Stems Ready ✓
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {modelOptions.map((option) => (
        <button
          key={option}
          type="button"
          className={`rounded-dropzone border px-3 py-2 font-mono text-xs uppercase ${model === option ? "border-accent text-accent" : "border-border text-text-muted"}`}
          onClick={() => onModelChange(option)}
        >
          {option === "2stems" ? "2 Stems" : "4 Stems"}
        </button>
      ))}
      <button type="button" className="rounded-dropzone bg-accent px-4 py-2 font-mono text-xs uppercase text-background" onClick={handleSeparate}>
        Separate Stems
      </button>
    </div>
  );
}
