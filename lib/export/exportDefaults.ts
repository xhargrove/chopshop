import type { WorkflowPreset } from "@/lib/workflowPresets";
import type { ExportDefaults } from "@/types/audioExport";

export const createExportDefaultsFromPreset = (preset: WorkflowPreset): ExportDefaults => ({
  region: preset.exportRegion,
  format: preset.exportFormat,
  mp3Bitrate: preset.mp3Bitrate,
  includeStems: preset.includeStems,
  exportSerato: preset.exportSerato,
  exportRekordbox: preset.exportRekordbox,
});

export const DEFAULT_EXPORT_DEFAULTS: ExportDefaults = {
  region: "full",
  format: "wav",
  mp3Bitrate: 320,
  includeStems: false,
  exportSerato: true,
  exportRekordbox: false,
};
