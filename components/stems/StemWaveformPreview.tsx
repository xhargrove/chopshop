"use client";

import { useEffect, useRef } from "react";

import { DESIGN_COLORS } from "@/lib/constants";

interface StemWaveformPreviewProps {
  audioBuffer: AudioBuffer;
}

export function StemWaveformPreview({ audioBuffer }: StemWaveformPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.max(Math.floor(data.length / width), 1);

    context.clearRect(0, 0, width, height);
    context.strokeStyle = DESIGN_COLORS.accent;
    context.beginPath();

    for (let x = 0; x < width; x += 1) {
      let peak = 0;
      const start = x * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, data.length);

      for (let index = start; index < end; index += 1) {
        peak = Math.max(peak, Math.abs(data[index]));
      }

      const y = (1 - peak) * (height / 2);
      context.moveTo(x, y);
      context.lineTo(x, height - y);
    }

    context.stroke();
  }, [audioBuffer]);

  return <canvas ref={canvasRef} width={200} height={40} className="h-10 w-[200px] rounded bg-background" aria-hidden="true" />;
}
