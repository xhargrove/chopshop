import { AnalysisStatusBar } from "@/components/ui/AnalysisStatusBar";
import { formatBPM, formatKey } from "@/lib/format";
import type { UseAudioAnalysisReturn } from "@/hooks/useAudioAnalysis";
import { useUndoStore } from "@/store/undoStore";
import type { AudioSession } from "@/types/audio";

interface SessionMetadataBarProps {
  session: AudioSession;
  analysis: UseAudioAnalysisReturn;
  beatGridVisible: boolean;
  onManualBpm: (bpm: number) => void;
  onToggleBeatGrid: () => void;
  onToggleBeatOffset: () => void;
}

export function SessionMetadataBar({
  session,
  analysis,
  beatGridVisible,
  onManualBpm,
  onToggleBeatGrid,
  onToggleBeatOffset,
}: SessionMetadataBarProps) {
  const canUndo = useUndoStore((state) => state.canUndo);
  const canRedo = useUndoStore((state) => state.canRedo);
  const undo = useUndoStore((state) => state.undo);
  const redo = useUndoStore((state) => state.redo);

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-dropzone border border-border bg-surface p-3" aria-label="Track metadata and analysis">
      <h2 className="font-display text-2xl tracking-[0.08em] text-text-primary">{session.file.name}</h2>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] disabled:opacity-40" onClick={undo} disabled={!canUndo} aria-label="Undo">
          Undo
        </button>
        <button type="button" className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] disabled:opacity-40" onClick={redo} disabled={!canRedo} aria-label="Redo">
          Redo
        </button>
        <p className="font-mono text-sm text-text-muted">BPM: {session.file.bpm ? formatBPM(session.file.bpm) : "--"}</p>
        <button type="button" className="font-mono text-sm text-accent" onClick={onToggleBeatOffset} aria-label="Open beat offset controls">
          ↗
        </button>
        <p className="font-mono text-sm text-text-muted">KEY: {session.file.key ? formatKey(session.file.key) : "--"}</p>
        <button
          type="button"
          className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em]"
          onClick={onToggleBeatGrid}
          aria-label="Toggle beat grid"
        >
          GRID: {beatGridVisible ? "ON" : "OFF"}
        </button>
        <AnalysisStatusBar analysis={analysis} bpm={session.file.bpm} keySignature={session.file.key} onManualBpm={onManualBpm} />
      </div>
    </section>
  );
}
