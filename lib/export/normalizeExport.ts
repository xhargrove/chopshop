import type { SeratoCueExport } from "@/lib/export/seratoExport";

export const FIXED_EXPORT_TIMESTAMP = "2026-01-01T00:00:00.000Z";

/** Deterministic Serato JSON for golden fixture comparison. */
export const normalizeSeratoExport = (payload: SeratoCueExport): SeratoCueExport => ({
  ...payload,
  exportedAt: FIXED_EXPORT_TIMESTAMP,
  cuePoints: [...payload.cuePoints].sort((left, right) => left.index - right.index),
  transitionCues: [...payload.transitionCues].sort((left, right) => left.positionMs - right.positionMs),
});

/** Strips volatile XML declaration whitespace for stable string compares. */
export const normalizeRekordboxXml = (xml: string): string => xml.replace(/\s+/g, " ").trim();
