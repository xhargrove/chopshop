import {
  BEAT_GRID_BAR_COLOR,
  BEAT_GRID_BEAT_COLOR,
  BEAT_GRID_LABEL_FONT_SIZE_PX,
  BEAT_GRID_LABEL_Y_PX,
  BEAT_GRID_PHRASE_COLOR,
  BLEEP_REGION_BORDER,
  BLEEP_REGION_FILL,
  CUE_BADGE_SIZE_PX,
  CUE_LINE_DASH_PX,
  CUE_LINE_GAP_PX,
  CUE_MARKER_SIZE_PX,
  DESIGN_COLORS,
  REGION_COLORS,
  REGION_HANDLE_WIDTH_PX,
  REGION_LABEL_FONT_SIZE_PX,
  REGION_LABEL_X_OFFSET_PX,
  REGION_LABEL_Y_OFFSET_PX,
} from "@/lib/constants";
import { getNearestBeatIndex } from "@/lib/beatGrid";
import type { BleepRegion, CuePoint, TransitionCue, WaveformRegion } from "@/types/audio";

interface RegionBounds {
  startX: number;
  endX: number;
  width: number;
}

export const getCanvasX = (canvas: HTMLCanvasElement, clientX: number): number => clientX - canvas.getBoundingClientRect().left;

export const getRegionBounds = (region: WaveformRegion, scrollOffsetSeconds: number, secondsPerPixel: number): RegionBounds => {
  const startX = (region.start - scrollOffsetSeconds) / secondsPerPixel;
  const endX = (region.end - scrollOffsetSeconds) / secondsPerPixel;

  return { startX, endX, width: endX - startX };
};

export const getCueX = (cuePoint: CuePoint, scrollOffsetSeconds: number, secondsPerPixel: number): number =>
  (cuePoint.position - scrollOffsetSeconds) / secondsPerPixel;

export const prepareCanvas = (
  canvas: HTMLCanvasElement,
  containerWidthPx: number,
  heightPx: number,
): CanvasRenderingContext2D | null => {
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = containerWidthPx * pixelRatio;
  canvas.height = heightPx * pixelRatio;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, containerWidthPx, heightPx);

  return context;
};

export const drawRegionCanvas = (
  context: CanvasRenderingContext2D,
  regions: WaveformRegion[],
  containerWidthPx: number,
  heightPx: number,
  scrollOffsetSeconds: number,
  secondsPerPixel: number,
  overrideRegion?: WaveformRegion,
): void => {
  context.font = `${REGION_LABEL_FONT_SIZE_PX}px var(--font-dm-mono), monospace`;
  context.textBaseline = "top";

  regions.map((region) => (overrideRegion?.id === region.id ? overrideRegion : region)).forEach((region) => {
    const { startX, width } = getRegionBounds(region, scrollOffsetSeconds, secondsPerPixel);
    const visibleX = Math.max(startX, 0);
    const visibleWidth = Math.min(startX + width, containerWidthPx) - visibleX;

    if (visibleWidth <= 0) {
      return;
    }

    const colors = REGION_COLORS[region.type];
    context.fillStyle = colors.fill;
    context.strokeStyle = colors.border;
    context.lineWidth = 1;
    context.fillRect(visibleX, 0, visibleWidth, heightPx);
    context.strokeRect(visibleX, 0, visibleWidth, heightPx);
    context.fillStyle = colors.border;
    context.fillRect(visibleX, 0, REGION_HANDLE_WIDTH_PX, heightPx);
    context.fillRect(visibleX + visibleWidth - REGION_HANDLE_WIDTH_PX, 0, REGION_HANDLE_WIDTH_PX, heightPx);
    context.fillStyle = DESIGN_COLORS.textPrimary;
    context.fillText(region.label, visibleX + REGION_LABEL_X_OFFSET_PX, REGION_LABEL_Y_OFFSET_PX);
  });
};

export const drawCueCanvas = (
  context: CanvasRenderingContext2D,
  cuePoints: CuePoint[],
  containerWidthPx: number,
  heightPx: number,
  scrollOffsetSeconds: number,
  secondsPerPixel: number,
  overrideCue?: CuePoint,
): void => {
  context.font = `${CUE_MARKER_SIZE_PX}px var(--font-dm-mono), monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  cuePoints.map((cuePoint) => (overrideCue?.id === cuePoint.id ? overrideCue : cuePoint)).forEach((cuePoint) => {
    const x = getCueX(cuePoint, scrollOffsetSeconds, secondsPerPixel);

    if (x < 0 || x > containerWidthPx) {
      return;
    }

    context.strokeStyle = cuePoint.color;
    context.fillStyle = cuePoint.color;
    context.setLineDash([CUE_LINE_DASH_PX, CUE_LINE_GAP_PX]);
    context.beginPath();
    context.moveTo(x, CUE_MARKER_SIZE_PX);
    context.lineTo(x, heightPx);
    context.stroke();
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(x, CUE_MARKER_SIZE_PX);
    context.lineTo(x - CUE_MARKER_SIZE_PX, 0);
    context.lineTo(x + CUE_MARKER_SIZE_PX, 0);
    context.closePath();
    context.fill();

    if (cuePoint.hotkey !== null) {
      context.fillStyle = DESIGN_COLORS.background;
      context.fillRect(x - CUE_BADGE_SIZE_PX / 2, CUE_MARKER_SIZE_PX * 2, CUE_BADGE_SIZE_PX, CUE_BADGE_SIZE_PX);
      context.fillStyle = DESIGN_COLORS.textPrimary;
      context.fillText(String(cuePoint.hotkey), x, CUE_MARKER_SIZE_PX * 2 + CUE_BADGE_SIZE_PX / 2);
    }
  });
};

export const drawBeatGridCanvas = (
  context: CanvasRenderingContext2D,
  beatPositions: readonly number[],
  bpm: number,
  beatOffset: number,
  scrollOffsetSeconds: number,
  secondsPerPixel: number,
  heightPx: number,
): void => {
  context.font = `${BEAT_GRID_LABEL_FONT_SIZE_PX}px var(--font-dm-mono), monospace`;
  context.textAlign = "left";
  context.textBaseline = "top";

  beatPositions.forEach((beatPosition) => {
    const beatIndex = getNearestBeatIndex(beatPosition, bpm, beatOffset);
    const x = (beatPosition - scrollOffsetSeconds) / secondsPerPixel;
    const isPhrase = beatIndex % 32 === 0;
    const isBar = beatIndex % 4 === 0;

    context.strokeStyle = isPhrase ? BEAT_GRID_PHRASE_COLOR : isBar ? BEAT_GRID_BAR_COLOR : BEAT_GRID_BEAT_COLOR;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, heightPx);
    context.stroke();

    if (isBar) {
      context.fillStyle = DESIGN_COLORS.textMuted;
      context.fillText(String(beatIndex / 4 + 1), x + 2, BEAT_GRID_LABEL_Y_PX);
    }
  });
};

const drawHatch = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void => {
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.strokeStyle = BLEEP_REGION_BORDER;
  context.lineWidth = 1;

  for (let offset = -height; offset < width + height; offset += 8) {
    context.beginPath();
    context.moveTo(x + offset, y);
    context.lineTo(x + offset + height, y + height);
    context.stroke();
  }

  context.restore();
};

export const drawBleepRegionCanvas = (
  context: CanvasRenderingContext2D,
  regions: BleepRegion[],
  containerWidthPx: number,
  heightPx: number,
  scrollOffsetSeconds: number,
  secondsPerPixel: number,
): void => {
  regions.forEach((region) => {
    const startX = (region.start - scrollOffsetSeconds) / secondsPerPixel;
    const endX = (region.end - scrollOffsetSeconds) / secondsPerPixel;
    const visibleX = Math.max(startX, 0);
    const visibleWidth = Math.min(endX, containerWidthPx) - visibleX;

    if (visibleWidth <= 0) {
      return;
    }

    context.fillStyle = BLEEP_REGION_FILL;
    context.fillRect(visibleX, 0, visibleWidth, heightPx);
    context.strokeStyle = BLEEP_REGION_BORDER;
    context.strokeRect(visibleX, 0, visibleWidth, heightPx);
    drawHatch(context, visibleX, 0, visibleWidth, heightPx);
    context.font = `${REGION_LABEL_FONT_SIZE_PX}px var(--font-dm-mono), monospace`;
    context.fillStyle = DESIGN_COLORS.textPrimary;
    context.fillText(region.label, visibleX + REGION_LABEL_X_OFFSET_PX, REGION_LABEL_Y_OFFSET_PX);
  });
};

export const drawTransitionCueCanvas = (
  context: CanvasRenderingContext2D,
  cues: TransitionCue[],
  containerWidthPx: number,
  heightPx: number,
  scrollOffsetSeconds: number,
  secondsPerPixel: number,
): void => {
  const accent = DESIGN_COLORS.accent;

  cues.forEach((cue) => {
    const centerX = (cue.position - scrollOffsetSeconds) / secondsPerPixel;
    const inX = (cue.inPoint - scrollOffsetSeconds) / secondsPerPixel;
    const outX = (cue.outPoint - scrollOffsetSeconds) / secondsPerPixel;

    if (centerX < 0 || centerX > containerWidthPx) {
      return;
    }

    context.strokeStyle = accent;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(centerX, 0);
    context.lineTo(centerX, heightPx);
    context.stroke();

    const bracketHeight = heightPx * 0.35;
    context.beginPath();
    context.moveTo(inX, bracketHeight);
    context.lineTo(inX, 0);
    context.lineTo(outX, 0);
    context.lineTo(outX, bracketHeight);
    context.stroke();

    context.font = `${REGION_LABEL_FONT_SIZE_PX}px var(--font-dm-mono), monospace`;
    context.fillStyle = accent;
    context.fillText(cue.label, centerX + REGION_LABEL_X_OFFSET_PX, REGION_LABEL_Y_OFFSET_PX + 14);
  });
};
