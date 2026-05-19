"use client";

import { useEffect, useRef, type ChangeEvent } from "react";

import { ANALYSIS_PROGRESS_COMPLETE, BPM_INPUT_STEP, LOW_CONFIDENCE_THRESHOLD, MAX_BPM, MIN_BPM } from "@/lib/constants";
import { formatBPM } from "@/lib/format";
import type { AnalysisState } from "@/types/audioAnalysis";

interface AnalysisStatusBarProps {
  analysis: AnalysisState;
  bpm: number | null;
  keySignature: string | null;
  onManualBpm: (bpm: number) => void;
}

export function AnalysisStatusBar({ analysis, bpm, keySignature, onManualBpm }: AnalysisStatusBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (analysis.stage === "error") {
      inputRef.current?.focus();
    }
  }, [analysis.stage]);

  if (analysis.stage === "idle") {
    return null;
  }

  if (analysis.stage === "error") {
    return (
      <label className="flex flex-wrap items-center gap-2 font-mono text-xs text-accent">
        <span>⚠ Analysis failed - enter BPM manually</span>
        <input
          ref={inputRef}
          className="w-24 rounded border border-border bg-background px-2 py-1 text-text-primary"
          type="number"
          min={MIN_BPM}
          max={MAX_BPM}
          step={BPM_INPUT_STEP}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onManualBpm(Number(event.target.value))}
          aria-label="Manual BPM after analysis failure"
        />
      </label>
    );
  }

  if (analysis.stage === "done") {
    const lowConfidence = (analysis.bpmConfidence ?? 1) < LOW_CONFIDENCE_THRESHOLD || (analysis.keyConfidence ?? 1) < LOW_CONFIDENCE_THRESHOLD;

    return (
      <p className="font-mono text-xs text-text-muted opacity-100 transition-opacity duration-300" aria-live="polite">
        {bpm ? formatBPM(bpm) : "BPM --"} {lowConfidence ? "~" : ""} · {keySignature ?? "--"}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-text-muted" aria-live="polite">
      <progress className="h-2 w-24 accent-accent" max={ANALYSIS_PROGRESS_COMPLETE} value={analysis.progress} aria-label="Audio analysis progress" />
      <span>
        Detecting {analysis.stage === "bpm" ? "BPM" : "key"}... {Math.round(analysis.progress)}%
      </span>
    </div>
  );
}
