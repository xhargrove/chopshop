"use client";

import { StemWaveformPreview } from "@/components/stems/StemWaveformPreview";
import type { StemType } from "@/types/stems";

interface StemRowProps {
  stem: StemType;
  audioBuffer: AudioBuffer;
  volume: number;
  muted: boolean;
  soloed: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
}

export function StemRow({ stem, audioBuffer, volume, muted, soloed, onVolumeChange, onToggleMute, onToggleSolo }: StemRowProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[80px_200px_auto_160px] md:items-center">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-primary">{stem}</span>
      <StemWaveformPreview audioBuffer={audioBuffer} />
      <div className="flex gap-2">
        <button type="button" className={`rounded border px-2 py-1 font-mono text-xs ${muted ? "border-accent text-accent" : "border-border"}`} onClick={onToggleMute} aria-label={`Mute ${stem}`}>
          M
        </button>
        <button type="button" className={`rounded border px-2 py-1 font-mono text-xs ${soloed ? "border-accent text-accent" : "border-border"}`} onClick={onToggleSolo} aria-label={`Solo ${stem}`}>
          S
        </button>
      </div>
      <label className="flex items-center gap-2 font-mono text-xs text-text-muted">
        <input className="w-full accent-accent" type="range" min={0} max={1} step={0.01} value={volume} onChange={(event) => onVolumeChange(Number(event.target.value))} />
        {Math.round(volume * 100)}%
      </label>
    </div>
  );
}
