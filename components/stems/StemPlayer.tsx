"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { StemRow } from "@/components/stems/StemRow";
import { DEFAULT_VOLUME } from "@/lib/constants";
import type { StemType } from "@/types/stems";

interface StemPlayerProps {
  stems: Partial<Record<StemType, AudioBuffer>>;
  onExportStems: () => void;
  onMixToStereo: () => void;
}

interface StemPlaybackNode {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

const START_DELAY_SECONDS = 0.01;

export function StemPlayer({ stems, onExportStems, onMixToStereo }: StemPlayerProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<Partial<Record<StemType, StemPlaybackNode>>>({});
  const startedAtRef = useRef(0);
  const offsetRef = useRef(0);
  const stemEntries = Object.entries(stems) as Array<[StemType, AudioBuffer]>;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumes, setVolumes] = useState<Partial<Record<StemType, number>>>({});
  const [muted, setMuted] = useState<Partial<Record<StemType, boolean>>>({});
  const [soloed, setSoloed] = useState<Partial<Record<StemType, boolean>>>({});

  const stopNodes = useCallback((): void => {
    Object.values(nodesRef.current).forEach((node) => node?.source.stop());
    nodesRef.current = {};
  }, []);

  const getContext = useCallback((): AudioContext => {
    const audioContext = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = audioContext;
    return audioContext;
  }, []);

  const getEffectiveVolume = useCallback(
    (stem: StemType): number => {
      const hasSolo = Object.values(soloed).some(Boolean);

      if (muted[stem] || (hasSolo && !soloed[stem])) {
        return 0;
      }

      return volumes[stem] ?? DEFAULT_VOLUME;
    },
    [muted, soloed, volumes],
  );

  const startNodes = useCallback(
    (offset: number): void => {
      const audioContext = getContext();
      const startTime = audioContext.currentTime + START_DELAY_SECONDS;
      stopNodes();

      stemEntries.forEach(([stem, audioBuffer]) => {
        const source = audioContext.createBufferSource();
        const gain = audioContext.createGain();
        source.buffer = audioBuffer;
        gain.gain.value = getEffectiveVolume(stem);
        source.connect(gain).connect(audioContext.destination);
        source.start(startTime, offset);
        nodesRef.current[stem] = { source, gain };
      });

      startedAtRef.current = startTime;
      offsetRef.current = offset;
      setIsPlaying(true);
    },
    [getContext, getEffectiveVolume, stemEntries, stopNodes],
  );

  useEffect(() => {
    Object.entries(nodesRef.current).forEach(([stem, node]) => {
      node?.gain.gain.setValueAtTime(getEffectiveVolume(stem as StemType), getContext().currentTime);
    });
  }, [getContext, getEffectiveVolume]);

  useEffect(() => {
    return () => {
      stopNodes();
      void audioContextRef.current?.close();
    };
  }, [stopNodes]);

  const handlePlayPause = (): void => {
    if (isPlaying) {
      const elapsed = getContext().currentTime - startedAtRef.current;
      offsetRef.current += Math.max(elapsed, 0);
      stopNodes();
      setIsPlaying(false);
      return;
    }

    startNodes(offsetRef.current);
  };

  return (
    <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Separated stems">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-3xl tracking-[0.08em] text-text-primary">Stems</h2>
        <button type="button" className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted" onClick={() => setIsCollapsed((value) => !value)}>
          {isCollapsed ? "Expand ▼" : "Collapse ▲"}
        </button>
      </div>
      {!isCollapsed ? (
        <div className="flex flex-col gap-3">
          {stemEntries.map(([stem, audioBuffer]) => (
            <StemRow
              key={stem}
              stem={stem}
              audioBuffer={audioBuffer}
              volume={volumes[stem] ?? DEFAULT_VOLUME}
              muted={muted[stem] ?? false}
              soloed={soloed[stem] ?? false}
              onVolumeChange={(volume) => setVolumes((current) => ({ ...current, [stem]: volume }))}
              onToggleMute={() => setMuted((current) => ({ ...current, [stem]: !current[stem] }))}
              onToggleSolo={() => setSoloed((current) => ({ ...current, [stem]: !current[stem] }))}
            />
          ))}
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" className="rounded-dropzone bg-accent px-4 py-2 font-mono text-xs uppercase text-background" onClick={handlePlayPause}>
              {isPlaying ? "Pause Stems" : "Play Stems"}
            </button>
            <button type="button" className="rounded-dropzone border border-border px-4 py-2 font-mono text-xs uppercase" onClick={onExportStems}>
              Export Stems
            </button>
            <button type="button" className="rounded-dropzone border border-border px-4 py-2 font-mono text-xs uppercase" onClick={onMixToStereo}>
              Mix To Stereo
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
