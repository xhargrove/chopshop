"use client";

import { useCallback, useState, type ChangeEvent } from "react";

import { AUDIO_START_SECONDS, DEFAULT_VOLUME, MAX_VOLUME, MIN_VOLUME, SEEK_STEP_SECONDS, VOLUME_STEP } from "@/lib/constants";
import { formatTime } from "@/lib/time";

interface TransportBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
}

export function TransportBar({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
}: TransportBarProps) {
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  const handlePlayPause = useCallback((): void => {
    if (isPlaying) {
      onPause();
      return;
    }

    onPlay();
  }, [isPlaying, onPause, onPlay]);

  const handleSeekBackward = useCallback((): void => {
    onSeek(Math.max(currentTime - SEEK_STEP_SECONDS, AUDIO_START_SECONDS));
  }, [currentTime, onSeek]);

  const handleSeekForward = useCallback((): void => {
    onSeek(Math.min(currentTime + SEEK_STEP_SECONDS, duration));
  }, [currentTime, duration, onSeek]);

  const handleVolumeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const nextVolume = Number(event.target.value);
      setVolume(nextVolume);
      onVolumeChange(nextVolume);
    },
    [onVolumeChange],
  );

  return (
    <section className="flex flex-col gap-4 rounded-dropzone border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between" aria-label="Transport controls">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-dropzone border border-border px-4 py-2 font-mono text-sm uppercase tracking-[0.2em] text-text-primary transition-colors hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          onClick={handleSeekBackward}
          aria-label={`Seek backward ${SEEK_STEP_SECONDS} seconds`}
        >
          Back
        </button>
        <button
          type="button"
          className="rounded-dropzone bg-accent px-5 py-2 font-mono text-sm uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          onClick={handlePlayPause}
          aria-label={isPlaying ? "Pause track" : "Play track"}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="rounded-dropzone border border-border px-4 py-2 font-mono text-sm uppercase tracking-[0.2em] text-text-primary transition-colors hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          onClick={handleSeekForward}
          aria-label={`Seek forward ${SEEK_STEP_SECONDS} seconds`}
        >
          Forward
        </button>
      </div>
      <p className="font-mono text-sm text-text-muted" aria-live="polite">
        {formatTime(currentTime)} / {formatTime(duration)}
      </p>
      <label className="flex min-w-48 items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
        Volume
        <input
          className="w-full accent-accent"
          type="range"
          min={MIN_VOLUME}
          max={MAX_VOLUME}
          step={VOLUME_STEP}
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Track volume"
        />
      </label>
    </section>
  );
}
