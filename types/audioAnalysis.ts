export type AnalysisStage = "idle" | "bpm" | "key" | "done" | "error";

export type WorkerInMessage =
  | { type: "ANALYZE_BPM"; audioBuffer: ArrayBuffer; sampleRate: number }
  | { type: "ANALYZE_KEY"; audioBuffer: ArrayBuffer; sampleRate: number }
  | { type: "ANALYZE_ALL"; audioBuffer: ArrayBuffer; sampleRate: number }
  | { type: "CANCEL" };

export type WorkerOutMessage =
  | { type: "BPM_RESULT"; bpm: number; confidence: number }
  | { type: "KEY_RESULT"; key: string; confidence: number }
  | { type: "PROGRESS"; stage: "bpm" | "key"; percent: number }
  | { type: "ERROR"; message: string }
  | { type: "CANCELLED" };

export interface AnalysisState {
  isAnalyzing: boolean;
  stage: AnalysisStage;
  progress: number;
  bpmResult: number | null;
  bpmConfidence: number | null;
  keyResult: string | null;
  keyConfidence: number | null;
  error: string | null;
}
