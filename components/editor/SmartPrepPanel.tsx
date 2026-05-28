"use client";

import { generateSmartPrepDraft } from "@/lib/smartPrep";
import type { AudioSession } from "@/types/audio";

interface SmartPrepPanelProps {
  session: AudioSession;
  onApply: () => void;
}

export function SmartPrepPanel({ session, onApply }: SmartPrepPanelProps) {
  const draft = generateSmartPrepDraft(session);

  return (
    <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Smart Prep suggestions">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl tracking-[0.08em] text-text-primary">Smart Prep</h3>
          <p className="mt-1 font-mono text-xs text-text-muted">Draft suggestions only — merges empty slots, never overwrites your cues.</p>
        </div>
        <button
          type="button"
          className="rounded-dropzone border border-accent px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] text-accent hover:bg-accent/10"
          onClick={onApply}
        >
          Apply draft
        </button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {draft.suggestions.map((suggestion) => (
          <li key={suggestion.id} className="rounded border border-border bg-background px-3 py-2">
            <p className="font-body text-sm text-text-primary">{suggestion.label}</p>
            <p className="font-mono text-[10px] text-text-muted">{suggestion.reason}</p>
            <p className="mt-1 font-mono text-[10px] uppercase text-text-muted">{Math.round(suggestion.confidence * 100)}% confidence</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
