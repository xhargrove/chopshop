"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Coalesces overlay redraws to one paint per animation frame.
 */
export function useCanvasLayer(draw: () => void, dependencies: readonly unknown[]): () => void {
  const drawRef = useRef(draw);
  drawRef.current = draw;

  const frameRef = useRef<number | null>(null);

  const scheduleDraw = useCallback((): void => {
    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      drawRef.current();
    });
  }, []);

  useEffect(() => {
    scheduleDraw();

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dependency list is caller-controlled
  }, [...dependencies, scheduleDraw]);

  return scheduleDraw;
}
