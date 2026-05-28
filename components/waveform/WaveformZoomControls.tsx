"use client";

interface WaveformZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
}

export function WaveformZoomControls({ onZoomIn, onZoomOut, onZoomFit }: WaveformZoomControlsProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Waveform zoom">
      <button
        type="button"
        className="rounded-dropzone border border-border px-2 py-1 font-mono text-xs uppercase tracking-[0.12em] text-text-muted hover:border-accent hover:text-accent"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        className="rounded-dropzone border border-border px-2 py-1 font-mono text-xs uppercase tracking-[0.12em] text-text-muted hover:border-accent hover:text-accent"
        onClick={onZoomFit}
        aria-label="Fit track to view"
      >
        Fit
      </button>
      <button
        type="button"
        className="rounded-dropzone border border-border px-2 py-1 font-mono text-xs uppercase tracking-[0.12em] text-text-muted hover:border-accent hover:text-accent"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
}
