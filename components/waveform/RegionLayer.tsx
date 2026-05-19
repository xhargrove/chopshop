"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

import { REGION_HANDLE_WIDTH_PX, REGION_MIN_DURATION_SECONDS, WAVEFORM_HEIGHT } from "@/lib/constants";
import { clampRegion, snapToBeat } from "@/lib/regions";
import { drawRegionCanvas, getCanvasX, getRegionBounds, prepareCanvas } from "@/lib/waveformCanvas";
import type { WaveformRegion } from "@/types/audio";

interface RegionLayerProps {
  regions: WaveformRegion[];
  durationSeconds: number;
  containerWidthPx: number;
  scrollOffsetSeconds: number;
  secondsPerPixel: number;
  bpm: number | null;
  snapEnabled: boolean;
  onRegionChange: (region: WaveformRegion) => void;
  onRegionClick: (regionId: string) => void;
}

type DragHandle = "start" | "end";

interface DragState {
  region: WaveformRegion;
  handle: DragHandle;
}

export function RegionLayer({
  regions,
  durationSeconds,
  containerWidthPx,
  scrollOffsetSeconds,
  secondsPerPixel,
  bpm,
  snapEnabled,
  onRegionChange,
  onRegionClick,
}: RegionLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const dragRegionRef = useRef<WaveformRegion | null>(null);
  const [cursorClass, setCursorClass] = useState("cursor-default");

  const drawRegions = useCallback(
    (overrideRegion?: WaveformRegion): void => {
      const canvas = canvasRef.current;

      if (!canvas || containerWidthPx <= 0 || secondsPerPixel <= 0) {
        return;
      }

      const context = prepareCanvas(canvas, containerWidthPx, WAVEFORM_HEIGHT);

      if (context) {
        drawRegionCanvas(context, regions, containerWidthPx, WAVEFORM_HEIGHT, scrollOffsetSeconds, secondsPerPixel, overrideRegion);
      }
    },
    [containerWidthPx, regions, scrollOffsetSeconds, secondsPerPixel],
  );

  useEffect(() => {
    drawRegions(dragRegionRef.current ?? undefined);
  }, [drawRegions]);

  const hitTest = useCallback(
    (x: number): { region: WaveformRegion; handle: DragHandle | null } | null => {
      for (const region of regions) {
        const { startX, endX } = getRegionBounds(region, scrollOffsetSeconds, secondsPerPixel);
        const isInside = x >= startX && x <= endX;

        if (!isInside) {
          continue;
        }

        const handle = Math.abs(x - startX) <= REGION_HANDLE_WIDTH_PX ? "start" : Math.abs(x - endX) <= REGION_HANDLE_WIDTH_PX ? "end" : null;
        return { region, handle };
      }

      return null;
    },
    [regions, scrollOffsetSeconds, secondsPerPixel],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;
      const hit = canvas ? hitTest(getCanvasX(canvas, event.clientX)) : null;

      if (!canvas || !hit) {
        return;
      }

      onRegionClick(hit.region.id);

      if (!hit.handle) {
        return;
      }

      canvas.setPointerCapture(event.pointerId);
      dragStateRef.current = {
        region: hit.region,
        handle: hit.handle,
      };
      dragRegionRef.current = hit.region;
      setCursorClass("cursor-ew-resize");
    },
    [hitTest, onRegionClick],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const pointerSeconds = scrollOffsetSeconds + getCanvasX(canvas, event.clientX) * secondsPerPixel;
      const dragState = dragStateRef.current;

      if (!dragState) {
        const hit = hitTest(getCanvasX(canvas, event.clientX));
        setCursorClass(hit?.handle ? "cursor-ew-resize" : hit ? "cursor-grab" : "cursor-default");
        return;
      }

      const nextRegion =
        dragState.handle === "start"
          ? { ...dragState.region, start: Math.min(pointerSeconds, dragState.region.end - REGION_MIN_DURATION_SECONDS) }
          : { ...dragState.region, end: Math.max(pointerSeconds, dragState.region.start + REGION_MIN_DURATION_SECONDS) };

      dragRegionRef.current = clampRegion(nextRegion, durationSeconds);
      drawRegions(dragRegionRef.current);
    },
    [drawRegions, durationSeconds, hitTest, scrollOffsetSeconds, secondsPerPixel],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;
      const dragState = dragStateRef.current;
      const draftRegion = dragRegionRef.current;

      if (canvas?.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      dragStateRef.current = null;
      dragRegionRef.current = null;
      setCursorClass("cursor-default");

      if (!dragState || !draftRegion) {
        return;
      }

      const snappedRegion =
        snapEnabled && bpm
          ? {
              ...draftRegion,
              [dragState.handle]: snapToBeat(draftRegion[dragState.handle], bpm, 4),
            }
          : draftRegion;

      onRegionChange(clampRegion(snappedRegion, durationSeconds));
    },
    [bpm, durationSeconds, onRegionChange, snapEnabled],
  );

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 z-10 h-full w-full ${cursorClass}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="Editable waveform regions"
    />
  );
}
