import type { StemType } from "@/types/stems";

export type ExportFormat = "wav" | "mp3" | "both";
export type StemExportFormat = false | "wav" | "mp3";
export type Mp3Bitrate = 128 | 192 | 320;
export type ExportRegion = "full" | "intro" | "outro" | { start: number; end: number };

export interface ExportOptions {
  region: ExportRegion;
  format: ExportFormat;
  mp3Bitrate: Mp3Bitrate;
  includeStems: StemExportFormat;
  stems?: Partial<Record<StemType, AudioBuffer>>;
  exportRekordbox?: boolean;
  exportSerato?: boolean;
}

export type ExportInMessage =
  | {
      type: "EXPORT_WAV";
      buffer: Float32Array;
      sampleRate: number;
      numChannels: number;
    }
  | {
      type: "EXPORT_MP3";
      buffer: Float32Array;
      sampleRate: number;
      numChannels: number;
      bitrate: Mp3Bitrate;
    }
  | {
      type: "EXPORT_STEM_ZIP";
      stems: Record<string, Float32Array>;
      sampleRate: number;
      format: "wav" | "mp3";
    };

export type ExportOutMessage = { type: "PROGRESS"; percent: number } | { type: "COMPLETE"; blob: Blob; filename: string } | { type: "ERROR"; message: string };
