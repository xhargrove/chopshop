"use client";

import { SeparationTrigger } from "@/components/stems/SeparationTrigger";
import { TransportBar } from "@/components/waveform/TransportBar";
import type { StemType } from "@/types/stems";

interface SessionToolbarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  file: File;
  stemModel: "2stems" | "4stems";
  hasStems: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onStemModelChange: (model: "2stems" | "4stems") => void;
  onStemsComplete: (stems: Partial<Record<StemType, AudioBuffer>>) => void;
  onOpenStems: () => void;
  onOpenExport: () => void;
}

export function SessionToolbar({
  isPlaying,
  currentTime,
  duration,
  file,
  stemModel,
  hasStems,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onStemModelChange,
  onStemsComplete,
  onOpenStems,
  onOpenExport,
}: SessionToolbarProps) {
  return (
    <section className="flex flex-col gap-3 rounded-dropzone border border-border bg-surface p-4" aria-label="Playback and export toolbar">
      <TransportBar isPlaying={isPlaying} currentTime={currentTime} duration={duration} onPlay={onPlay} onPause={onPause} onSeek={onSeek} onVolumeChange={onVolumeChange} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeparationTrigger file={file} model={stemModel} hasStems={hasStems} onModelChange={onStemModelChange} onComplete={onStemsComplete} onOpenStems={onOpenStems} />
        <button type="button" className="rounded-dropzone border border-accent px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-accent" onClick={onOpenExport}>
          Export ↓
        </button>
      </div>
    </section>
  );
}
