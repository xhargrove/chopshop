"use client";

import { useEffect, useState } from "react";

import { useAcapellaSwap } from "@/hooks/useAcapellaSwap";
import type { AudioSession } from "@/types/audio";
import type { StemType } from "@/types/stems";

interface AcapellaSwapProps {
  session: AudioSession;
  stems: Partial<Record<StemType, AudioBuffer>>;
  onCommit: (payload: { vocalsGain: number; instrumentalGain: number; offsetSeconds: number }) => void;
  onClear: () => void;
}

export function AcapellaSwap({ session, stems, onCommit, onClear }: AcapellaSwapProps) {
  const [trackBuffer, setTrackBuffer] = useState<AudioBuffer | null>(null);
  const swap = useAcapellaSwap({ trackBuffer, stems, onCommit });
  const hasVocals = Boolean(stems.vocals);
  const hasInstrumental = Boolean(stems.drums || stems.bass || stems.other);

  useEffect(() => {
    let isMounted = true;

    const decodeTrack = async (): Promise<void> => {
      const context = new AudioContext();
      const buffer = await context.decodeAudioData(await session.file.sourceFile.arrayBuffer());
      await context.close();

      if (isMounted) {
        setTrackBuffer(buffer);
      }
    };

    void decodeTrack();

    return () => {
      isMounted = false;
    };
  }, [session.file.sourceFile]);

  return (
    <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Acapella swap controls">
      <h2 className="mb-4 font-display text-2xl tracking-[0.08em] text-text-primary">Acapella Swap</h2>
      {!hasVocals || !hasInstrumental ? (
        <p className="font-mono text-sm text-text-muted">Separate stems first (vocals + drums/bass/other) to preview a swap.</p>
      ) : (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
              Vocals gain
              <input type="range" min={0} max={2} step={0.05} value={swap.vocalsGain} onChange={(event) => swap.setVocalsGain(Number(event.target.value))} />
            </label>
            <label className="flex flex-col gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
              Instrumental gain
              <input type="range" min={0} max={2} step={0.05} value={swap.instrumentalGain} onChange={(event) => swap.setInstrumentalGain(Number(event.target.value))} />
            </label>
          </div>
          <p className="mb-3 font-mono text-sm text-text-muted">Offset: {swap.offsetSeconds.toFixed(3)}s {swap.isAligning ? "(aligning…)" : ""}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em]" onClick={() => void swap.alignOffset()} disabled={swap.isAligning}>
              Auto-align
            </button>
            <button type="button" className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em]" onClick={() => void swap.preview()} disabled={swap.isPreviewing}>
              Preview mix
            </button>
            <button type="button" className="rounded-dropzone border border-border px-3 py-2 font-mono text-xs uppercase tracking-[0.16em]" onClick={swap.stopPreview} disabled={!swap.isPreviewing}>
              Stop
            </button>
            <button type="button" className="rounded-dropzone border border-accent px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] text-accent" onClick={swap.commit}>
              Commit swap
            </button>
          </div>
        </>
      )}
      {session.acapellaSwap ? (
        <button type="button" className="mt-4 font-mono text-sm text-text-muted" onClick={onClear}>
          Clear committed swap metadata
        </button>
      ) : null}
    </section>
  );
}
