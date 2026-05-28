"use client";

import { useUndoStore } from "@/store/undoStore";

export function EditHistory() {
  const history = useUndoStore((state) => state.history);
  const canUndo = useUndoStore((state) => state.canUndo);
  const undo = useUndoStore((state) => state.undo);

  return (
    <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Edit history">
      <h2 className="mb-4 font-display text-2xl tracking-[0.08em] text-text-primary">Edit History</h2>
      {!canUndo ? <p className="font-mono text-sm text-text-muted">No edits to restore yet.</p> : null}
      <ol className="space-y-2">
        {history.map((entry, index) => (
          <li key={`${entry.timestamp}-${index}`}>
            <button
              type="button"
              className="w-full rounded-dropzone border border-border px-3 py-2 text-left font-mono text-sm text-text-primary"
              onClick={() => {
                const steps = history.length - index;

                for (let step = 0; step < steps; step += 1) {
                  undo();
                }
              }}
            >
              {entry.label}
              <span className="ml-2 text-text-muted">{new Date(entry.timestamp).toLocaleTimeString()}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
