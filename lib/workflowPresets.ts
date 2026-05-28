import type { BleepMode, EditorSettings, EditorTabId, WorkflowPresetId } from "@/types/audio";
import type { ExportDefaults, ExportFormat, ExportRegion, Mp3Bitrate, StemExportFormat } from "@/types/audioExport";

export interface WorkflowPreset {
  id: WorkflowPresetId;
  label: string;
  description: string;
  activeTab: EditorTabId;
  snapDivision: EditorSettings["snapDivision"];
  beatGridVisible: boolean;
  defaultBleepMode?: BleepMode;
  suggestSmartPrep: boolean;
  exportRegion: ExportRegion;
  exportFormat: ExportFormat;
  mp3Bitrate: Mp3Bitrate;
  includeStems: StemExportFormat;
  exportSerato: boolean;
  exportRekordbox: boolean;
}

export const WORKFLOW_PRESETS: readonly WorkflowPreset[] = [
  {
    id: "serato-prep",
    label: "Serato Prep",
    description: "Hot cues, loop markers, Serato JSON export.",
    activeTab: "prepare",
    snapDivision: 4,
    beatGridVisible: true,
    suggestSmartPrep: true,
    exportRegion: "full",
    exportFormat: "wav",
    mp3Bitrate: 320,
    includeStems: false,
    exportSerato: true,
    exportRekordbox: false,
  },
  {
    id: "rekordbox-prep",
    label: "Rekordbox Prep",
    description: "Grid-aligned cues with Rekordbox XML export.",
    activeTab: "prepare",
    snapDivision: 4,
    beatGridVisible: true,
    suggestSmartPrep: true,
    exportRegion: "full",
    exportFormat: "wav",
    mp3Bitrate: 320,
    includeStems: false,
    exportSerato: false,
    exportRekordbox: true,
  },
  {
    id: "club-intro",
    label: "Club Intro",
    description: "Mark a mix-friendly intro region fast.",
    activeTab: "edit",
    snapDivision: 1,
    beatGridVisible: true,
    suggestSmartPrep: true,
    exportRegion: "intro",
    exportFormat: "wav",
    mp3Bitrate: 320,
    includeStems: false,
    exportSerato: false,
    exportRekordbox: false,
  },
  {
    id: "quick-mix-outro",
    label: "Quick Mix Outro",
    description: "Outro boundaries and transition cues.",
    activeTab: "edit",
    snapDivision: 2,
    beatGridVisible: true,
    suggestSmartPrep: false,
    exportRegion: "outro",
    exportFormat: "wav",
    mp3Bitrate: 320,
    includeStems: false,
    exportSerato: false,
    exportRekordbox: true,
  },
  {
    id: "radio-clean",
    label: "Radio Clean",
    description: "Bleep/mute regions with clean export defaults.",
    activeTab: "clean",
    snapDivision: null,
    beatGridVisible: false,
    defaultBleepMode: "bleep",
    suggestSmartPrep: true,
    exportRegion: "full",
    exportFormat: "both",
    mp3Bitrate: 192,
    includeStems: false,
    exportSerato: false,
    exportRekordbox: false,
  },
  {
    id: "festival-transition",
    label: "Festival Transition",
    description: "Wide mix windows for big-room transitions.",
    activeTab: "transition",
    snapDivision: 1,
    beatGridVisible: true,
    suggestSmartPrep: false,
    exportRegion: "full",
    exportFormat: "wav",
    mp3Bitrate: 320,
    includeStems: false,
    exportSerato: true,
    exportRekordbox: true,
  },
  {
    id: "acapella-swap",
    label: "Acapella Swap",
    description: "Stem-assisted vocal/instrumental swap workflow.",
    activeTab: "swap",
    snapDivision: 4,
    beatGridVisible: true,
    suggestSmartPrep: false,
    exportRegion: "full",
    exportFormat: "wav",
    mp3Bitrate: 320,
    includeStems: "wav",
    exportSerato: false,
    exportRekordbox: false,
  },
] as const;

export const getWorkflowPreset = (id: WorkflowPresetId): WorkflowPreset | undefined =>
  WORKFLOW_PRESETS.find((preset) => preset.id === id);
