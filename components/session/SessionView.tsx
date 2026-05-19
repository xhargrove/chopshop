"use client";

import { useCallback, useEffect } from "react";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TransportBar } from "@/components/waveform/TransportBar";
import { WaveformDisplay } from "@/components/waveform/WaveformDisplay";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { formatTime } from "@/lib/time";
import type { AudioSession } from "@/types/audio";

interface SessionViewProps {
  session: AudioSession;
  onClearSession: () => void;
  onPlayheadChange: (position: number) => void;
}

export function SessionView({ session, onClearSession, onPlayheadChange }: SessionViewProps) {
  const { currentTime, duration, error, isLoaded, isPlaying, load, pause, play, seek, setVolume } = useAudioEngine();
  const totalDuration = duration || session.file.durationSeconds;

  useEffect(() => {
    void load(session.file.url);
  }, [load, session.file.url]);

  useEffect(() => {
    onPlayheadChange(currentTime);
  }, [currentTime, onPlayheadChange]);

  const handleSeek = useCallback(
    (seconds: number): void => {
      seek(seconds);
      onPlayheadChange(seconds);
    },
    [onPlayheadChange, seek],
  );

  return (
    <section className="flex flex-col gap-5" aria-label="Loaded audio session">
      <header className="flex flex-col gap-3 rounded-dropzone border border-border bg-surface p-4 font-mono text-sm text-text-muted md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em]">Track</p>
          <h1 className="mt-1 max-w-3xl truncate text-lg text-text-primary">{session.file.name}</h1>
        </div>
        <dl className="flex flex-wrap gap-5">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em]">BPM</dt>
            <dd className="mt-1 text-text-primary">{session.file.bpm ?? "--"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em]">Key</dt>
            <dd className="mt-1 text-text-primary">{session.file.key ?? "--"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em]">Length</dt>
            <dd className="mt-1 text-text-primary">{formatTime(totalDuration)}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="rounded-dropzone border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-text-primary transition-colors hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          onClick={onClearSession}
          aria-label="Clear loaded track"
        >
          Clear
        </button>
      </header>

      {!isLoaded ? <LoadingSpinner label="Loading audio engine" /> : null}
      {error ? (
        <p className="rounded-dropzone border border-border bg-surface px-4 py-3 font-body text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}

      <ErrorBoundary fallbackTitle="Waveform failed" fallbackMessage="The waveform renderer could not load this track.">
        <WaveformDisplay audioUrl={session.file.url} currentTime={currentTime} duration={totalDuration} onSeek={handleSeek} />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Transport failed" fallbackMessage="Playback controls could not render.">
        <TransportBar
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={totalDuration}
          onPlay={play}
          onPause={pause}
          onSeek={handleSeek}
          onVolumeChange={setVolume}
        />
      </ErrorBoundary>
    </section>
  );
}
