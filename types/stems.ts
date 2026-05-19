import type { STEM_MODEL_TYPES, STEM_TYPES } from "@/lib/constants";

export type StemType = (typeof STEM_TYPES)[number];
export type StemModel = (typeof STEM_MODEL_TYPES)[number];

export type SeparationEvent =
  | { type: "PROGRESS"; percent: number; stage: string }
  | { type: "STEM_READY"; stem: StemType; url: string }
  | { type: "COMPLETE"; stems: Partial<Record<StemType, string>>; failures?: Partial<Record<StemType, string>> }
  | { type: "ERROR"; message: string; code: number };

export interface StemSeparationState {
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  progress: number;
  stage: string;
  stems: Partial<Record<StemType, AudioBuffer>>;
  error: string | null;
}
