"use client";

import { useCallback } from "react";

import { DEFAULT_BEATS_PER_BAR, REGION_MIN_DURATION_SECONDS } from "@/lib/constants";
import { clampRegion, createRegion, extendByBeats, snapToBeat, trimToNBars } from "@/lib/regions";
import type { AudioSession, WaveformRegion } from "@/types/audio";

type RegionType = WaveformRegion["type"];
type Boundary = "start" | "end";

interface RegionEditor {
  setBoundary: (type: RegionType, boundary: Boundary, position: number) => void;
  clearRegion: (type: RegionType) => void;
  extendRegion: (type: RegionType, bars: number) => void;
  trimRegion: (type: RegionType, bars: number) => void;
  toggleLoopSelection: () => void;
}

interface RegionEditorOptions {
  session: AudioSession;
  snapDivision: 1 | 2 | 4 | null;
  updateRegions: (regions: WaveformRegion[]) => void;
  setActiveRegion: (id: string | null) => void;
}

const getSnappedPosition = (position: number, bpm: number | null, snapDivision: 1 | 2 | 4 | null): number =>
  bpm && snapDivision ? snapToBeat(position, bpm, snapDivision) : position;

const ensureDuration = (region: WaveformRegion): WaveformRegion =>
  region.end - region.start >= REGION_MIN_DURATION_SECONDS ? region : { ...region, end: region.start + REGION_MIN_DURATION_SECONDS };

export function useRegionEditor({ session, snapDivision, updateRegions, setActiveRegion }: RegionEditorOptions): RegionEditor {
  const commitRegion = useCallback(
    (region: WaveformRegion): void => {
      const nextRegion = clampRegion(ensureDuration(region), session.file.durationSeconds);
      const nextRegions = session.regions.some((candidate) => candidate.id === nextRegion.id)
        ? session.regions.map((candidate) => (candidate.id === nextRegion.id ? nextRegion : candidate))
        : [...session.regions.filter((candidate) => candidate.type !== nextRegion.type), nextRegion];

      updateRegions(nextRegions);
      setActiveRegion(nextRegion.id);
    },
    [session.file.durationSeconds, session.regions, setActiveRegion, updateRegions],
  );

  const setBoundary = useCallback(
    (type: RegionType, boundary: Boundary, position: number): void => {
      const snappedPosition = getSnappedPosition(position, session.file.bpm, snapDivision);
      const existingRegion = session.regions.find((region) => region.type === type);
      const region =
        existingRegion ??
        createRegion(
          type,
          boundary === "start" ? snappedPosition : Math.max(snappedPosition - REGION_MIN_DURATION_SECONDS, 0),
          boundary === "end" ? snappedPosition : snappedPosition + REGION_MIN_DURATION_SECONDS,
          session.file.durationSeconds,
        );

      commitRegion(
        clampRegion(
          {
            ...region,
            [boundary]: snappedPosition,
          },
          session.file.durationSeconds,
        ),
      );
    },
    [commitRegion, session.file.bpm, session.file.durationSeconds, session.regions, snapDivision],
  );

  const clearRegion = useCallback(
    (type: RegionType): void => {
      const region = session.regions.find((candidate) => candidate.type === type);
      updateRegions(session.regions.filter((candidate) => candidate.type !== type));
      setActiveRegion(region ? null : session.regions[0]?.id ?? null);
    },
    [session.regions, setActiveRegion, updateRegions],
  );

  const extendRegion = useCallback(
    (type: RegionType, bars: number): void => {
      const region = session.regions.find((candidate) => candidate.type === type);

      if (!region || !session.file.bpm) {
        return;
      }

      const direction = type === "outro" ? "start" : "end";
      commitRegion(clampRegion(extendByBeats(region, bars * DEFAULT_BEATS_PER_BAR, session.file.bpm, direction), session.file.durationSeconds));
    },
    [commitRegion, session.file.bpm, session.file.durationSeconds, session.regions],
  );

  const trimRegion = useCallback(
    (type: RegionType, bars: number): void => {
      const region = session.regions.find((candidate) => candidate.type === type);

      if (!region || !session.file.bpm) {
        return;
      }

      const anchor = type === "outro" ? "end" : "start";
      commitRegion(clampRegion(trimToNBars(region, bars, session.file.bpm, DEFAULT_BEATS_PER_BAR, anchor), session.file.durationSeconds));
    },
    [commitRegion, session.file.bpm, session.file.durationSeconds, session.regions],
  );

  const toggleLoopSelection = useCallback((): void => {
    const selection = session.regions.find((region) => region.type === "selection");

    if (!selection) {
      return;
    }

    commitRegion({
      ...selection,
      id: "loop-selection",
      type: "loop",
      label: "Loop",
    });
  }, [commitRegion, session.regions]);

  return {
    setBoundary,
    clearRegion,
    extendRegion,
    trimRegion,
    toggleLoopSelection,
  };
}
