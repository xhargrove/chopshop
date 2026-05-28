"use client";

import { generateRekordboxXml } from "@/lib/export/rekordboxXml";
import { generateSeratoCueExport } from "@/lib/export/seratoExport";
import { formatTime } from "@/lib/format";
import type { AudioSession, TransitionCue } from "@/types/audio";

interface TransitionCuePanelProps {
  session: AudioSession;
  currentTime: number;
  onAddCue: (position: number, type: TransitionCue["type"]) => void;
  onRemoveCue: (id: string) => void;
}

const downloadTextFile = (contents: string, filename: string, mimeType: string): void => {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const sanitizeName = (fileName: string): string => fileName.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]+/gi, "_");

export function TransitionCuePanel({ session, currentTime, onAddCue, onRemoveCue }: TransitionCuePanelProps) {
  const baseName = sanitizeName(session.file.name);

  const handleRekordboxExport = (): void => {
    const xml = generateRekordboxXml(session, "Transition Edit");
    downloadTextFile(xml, `${baseName}_rekordbox.xml`, "application/xml");
  };

  const handleSeratoExport = (): void => {
    const payload = generateSeratoCueExport(session);
    downloadTextFile(JSON.stringify(payload, null, 2), `${baseName}_serato_cues.json`, "application/json");
  };

  return (
    <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Transition cue controls">
      <h2 className="mb-4 font-display text-2xl tracking-[0.08em] text-text-primary">Transition Cues</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em]" onClick={() => onAddCue(currentTime, "mix-in")}>
          Mix-in @ {formatTime(currentTime)}
        </button>
        <button type="button" className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em]" onClick={() => onAddCue(currentTime, "mix-out")}>
          Mix-out @ {formatTime(currentTime)}
        </button>
      </div>
      <ul className="mb-4 space-y-2" aria-label="Transition cues">
        {session.transitionCues.map((cue) => (
          <li key={cue.id} className="flex items-center justify-between rounded-dropzone border border-border px-3 py-2 font-mono text-sm">
            <span>
              {cue.label} · {cue.type} · {formatTime(cue.position)}
            </span>
            <button type="button" className="text-text-muted" onClick={() => onRemoveCue(cue.id)} aria-label={`Remove ${cue.label}`}>
              ✕
            </button>
          </li>
        ))}
        {session.transitionCues.length === 0 ? <li className="font-mono text-sm text-text-muted">No transition cues yet.</li> : null}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-dropzone border border-accent px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] text-accent" onClick={handleRekordboxExport}>
          Export Rekordbox XML
        </button>
        <button type="button" className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em]" onClick={handleSeratoExport}>
          Export Serato JSON
        </button>
      </div>
      <p className="mt-3 font-mono text-xs text-text-muted">Serato export is a JSON sidecar. Crate files (.crate) are not generated in-browser.</p>
    </section>
  );
}
