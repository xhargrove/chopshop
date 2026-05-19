"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

import { ContextMenu } from "@/components/menus/ContextMenu";
import { CUE_MARKER_SIZE_PX, WAVEFORM_HEIGHT } from "@/lib/constants";
import { drawCueCanvas, getCanvasX, getCueX, prepareCanvas } from "@/lib/waveformCanvas";
import type { CuePoint } from "@/types/audio";

interface CuePointLayerProps {
  cuePoints: CuePoint[];
  durationSeconds: number;
  containerWidthPx: number;
  scrollOffsetSeconds: number;
  secondsPerPixel: number;
  onCueAdd: (position: number) => void;
  onCueSelect: (cueId: string) => void;
  onCueMove: (cue: CuePoint) => void;
  onCueDelete: (cueId: string) => void;
  onCueRenameRequest: (cueId: string) => void;
}

interface CueContextMenu {
  cueId: string;
  x: number;
  y: number;
}

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);

export function CuePointLayer({
  cuePoints,
  durationSeconds,
  containerWidthPx,
  scrollOffsetSeconds,
  secondsPerPixel,
  onCueAdd,
  onCueSelect,
  onCueMove,
  onCueDelete,
  onCueRenameRequest,
}: CuePointLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggedCueRef = useRef<CuePoint | null>(null);
  const draftCueRef = useRef<CuePoint | null>(null);
  const [contextMenu, setContextMenu] = useState<CueContextMenu | null>(null);
  const [cursorClass, setCursorClass] = useState("cursor-crosshair");

  const drawCuePoints = useCallback(
    (overrideCue?: CuePoint): void => {
      const canvas = canvasRef.current;

      if (!canvas || containerWidthPx <= 0 || secondsPerPixel <= 0) {
        return;
      }

      const context = prepareCanvas(canvas, containerWidthPx, WAVEFORM_HEIGHT);

      if (context) {
        drawCueCanvas(context, cuePoints, containerWidthPx, WAVEFORM_HEIGHT, scrollOffsetSeconds, secondsPerPixel, overrideCue);
      }
    },
    [containerWidthPx, cuePoints, scrollOffsetSeconds, secondsPerPixel],
  );

  useEffect(() => {
    drawCuePoints(draftCueRef.current ?? undefined);
  }, [drawCuePoints]);

  const hitTest = useCallback(
    (x: number): CuePoint | null =>
      cuePoints.find((cuePoint) => Math.abs(getCueX(cuePoint, scrollOffsetSeconds, secondsPerPixel) - x) <= CUE_MARKER_SIZE_PX) ?? null,
    [cuePoints, scrollOffsetSeconds, secondsPerPixel],
  );

  const getPointerPosition = useCallback(
    (canvas: HTMLCanvasElement, clientX: number): number => clamp(scrollOffsetSeconds + getCanvasX(canvas, clientX) * secondsPerPixel, 0, durationSeconds),
    [durationSeconds, scrollOffsetSeconds, secondsPerPixel],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;
      const hit = canvas ? hitTest(getCanvasX(canvas, event.clientX)) : null;

      if (!canvas) {
        return;
      }

      if (event.button === 2) {
        event.preventDefault();
        if (hit) {
          setContextMenu({ cueId: hit.id, x: event.clientX, y: event.clientY });
        }
        return;
      }

      if (!hit) {
        onCueAdd(getPointerPosition(canvas, event.clientX));
        return;
      }

      canvas.setPointerCapture(event.pointerId);
      draggedCueRef.current = hit;
      draftCueRef.current = hit;
      onCueSelect(hit.id);
      setCursorClass("cursor-grabbing");
    },
    [getPointerPosition, hitTest, onCueAdd, onCueSelect],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const draggedCue = draggedCueRef.current;

      if (!draggedCue) {
        setCursorClass(hitTest(getCanvasX(canvas, event.clientX)) ? "cursor-grab" : "cursor-crosshair");
        return;
      }

      const nextCue = {
        ...draggedCue,
        position: getPointerPosition(canvas, event.clientX),
      };

      draftCueRef.current = nextCue;
      drawCuePoints(nextCue);
    },
    [drawCuePoints, getPointerPosition, hitTest],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;
      const draftCue = draftCueRef.current;

      if (canvas?.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      draggedCueRef.current = null;
      draftCueRef.current = null;
      setCursorClass("cursor-crosshair");

      if (draftCue) {
        onCueMove(draftCue);
      }
    },
    [onCueMove],
  );

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-20 h-full w-full ${cursorClass}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(event) => event.preventDefault()}
        aria-label="Cue point layer"
      />
      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            { label: "Rename", onSelect: () => onCueRenameRequest(contextMenu.cueId) },
            { label: "Delete", onSelect: () => onCueDelete(contextMenu.cueId) },
          ]}
          onDismiss={() => setContextMenu(null)}
        />
      ) : null}
    </>
  );
}
