"use client";

import { useEffect, useMemo, useState } from "react";

import { useExport } from "@/hooks/useExport";
import { useAudioStore } from "@/store/audioStore";
import { EXPORT_MP3_BITRATES } from "@/lib/constants";
import type { AudioSession, WaveformRegion } from "@/types/audio";
import type { ExportFormat, ExportRegion, Mp3Bitrate, StemExportFormat } from "@/types/audioExport";
import type { StemType } from "@/types/stems";

interface ExportPanelProps {
  session: AudioSession;
  stems: Partial<Record<StemType, AudioBuffer>>;
  onClose: () => void;
}

const formatOptions: ExportFormat[] = ["wav", "mp3", "both"];
const stemExportOptions: StemExportFormat[] = [false, "wav", "mp3"];

const sanitizeTrackName = (fileName: string): string =>
  fileName
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const isExportableRegion = (region: WaveformRegion): region is WaveformRegion & { type: "intro" | "outro" } => region.type === "intro" || region.type === "outro";

const getRegionOptions = (regions: WaveformRegion[]): Array<{ label: string; value: ExportRegion }> => [
  { label: "Full Track", value: "full" },
  ...regions.filter(isExportableRegion).map((region) => ({ label: region.label, value: region.type })),
];

const getRegionLabel = (region: ExportRegion): string => (typeof region === "string" ? region : "selection");

export function ExportPanel({ session, stems, onClose }: ExportPanelProps) {
  const { exportFiles, isExporting, progress, exportError, lastVerification } = useExport();
  const exportDefaults = useAudioStore((state) => state.editorSettings.exportDefaults);
  const activeWorkflowPreset = useAudioStore((state) => state.editorSettings.activeWorkflowPreset);
  const [region, setRegion] = useState<ExportRegion>(exportDefaults.region);
  const [format, setFormat] = useState<ExportFormat>(exportDefaults.format);
  const [mp3Bitrate, setMp3Bitrate] = useState<Mp3Bitrate>(exportDefaults.mp3Bitrate);
  const [includeStems, setIncludeStems] = useState<StemExportFormat>(exportDefaults.includeStems);
  const [exportRekordbox, setExportRekordbox] = useState(exportDefaults.exportRekordbox);
  const [exportSerato, setExportSerato] = useState(exportDefaults.exportSerato);

  useEffect(() => {
    setRegion(exportDefaults.region);
    setFormat(exportDefaults.format);
    setMp3Bitrate(exportDefaults.mp3Bitrate);
    setIncludeStems(exportDefaults.includeStems);
    setExportRekordbox(exportDefaults.exportRekordbox);
    setExportSerato(exportDefaults.exportSerato);
  }, [exportDefaults, activeWorkflowPreset]);
  const hasStems = Object.keys(stems).length > 0;
  const baseName = sanitizeTrackName(session.file.name);
  const regionLabel = getRegionLabel(region);
  const previews = useMemo(() => {
    const files: string[] = [];

    if (format === "wav" || format === "both") {
      files.push(`${baseName}_${regionLabel}.wav`);
    }

    if (format === "mp3" || format === "both") {
      files.push(`${baseName}_${regionLabel}.mp3`);
    }

    if (includeStems) {
      files.push(`${baseName}_stems.zip`);
    }

    if (exportRekordbox) {
      files.push(`${baseName}_rekordbox.xml`);
    }

    if (exportSerato) {
      files.push(`${baseName}_serato_cues.json`);
    }

    return files;
  }, [baseName, exportRekordbox, exportSerato, format, includeStems, regionLabel]);

  const handleExport = (): void => {
    void exportFiles(session, { region, format, mp3Bitrate, includeStems, stems, exportRekordbox, exportSerato }).catch(() => undefined);
  };

  return (
    <section className="rounded-dropzone border border-border bg-surface p-4" aria-label="Export edit panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-3xl tracking-[0.08em] text-text-primary">Export Edit</h2>
        <button type="button" className="font-mono text-sm text-text-muted" onClick={onClose} aria-label="Close export panel">
          ✕
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Region
          <select className="rounded-dropzone border border-border bg-background px-3 py-2 text-text-primary" value={String(region)} onChange={(event) => setRegion(event.target.value as ExportRegion)}>
            {getRegionOptions(session.regions).map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="rounded-dropzone border border-border p-3">
          <legend className="px-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Format</legend>
          <div className="flex flex-wrap gap-2">
            {formatOptions.map((option) => (
              <button key={option} type="button" className={`rounded border px-3 py-2 font-mono text-xs uppercase ${format === option ? "border-accent text-accent" : "border-border"}`} onClick={() => setFormat(option)}>
                {option}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="rounded-dropzone border border-border p-3">
          <legend className="px-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">MP3 quality</legend>
          <div className="flex flex-wrap gap-2">
            {EXPORT_MP3_BITRATES.map((bitrate) => (
              <button key={bitrate} type="button" className={`rounded border px-3 py-2 font-mono text-xs ${mp3Bitrate === bitrate ? "border-accent text-accent" : "border-border"}`} onClick={() => setMp3Bitrate(bitrate)}>
                {bitrate} kbps
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="rounded-dropzone border border-border p-3 md:col-span-2">
          <legend className="px-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">DJ library exports</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`rounded border px-3 py-2 font-mono text-xs uppercase ${exportRekordbox ? "border-accent text-accent" : "border-border"}`} onClick={() => setExportRekordbox((value) => !value)}>
              Rekordbox XML
            </button>
            <button type="button" className={`rounded border px-3 py-2 font-mono text-xs uppercase ${exportSerato ? "border-accent text-accent" : "border-border"}`} onClick={() => setExportSerato((value) => !value)}>
              Serato JSON
            </button>
          </div>
          <p className="mt-2 font-mono text-xs text-text-muted">Serato export is a JSON sidecar only; .crate files are not generated here.</p>
        </fieldset>
        <fieldset className="rounded-dropzone border border-border p-3">
          <legend className="px-2 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Include stems</legend>
          <div className="flex flex-wrap gap-2">
            {stemExportOptions.map((option) => (
              <button key={String(option)} type="button" className={`rounded border px-3 py-2 font-mono text-xs uppercase ${includeStems === option ? "border-accent text-accent" : "border-border"}`} onClick={() => setIncludeStems(option)}>
                {option || "off"}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      {includeStems && !hasStems ? <p className="mt-4 font-body text-sm text-accent">Run stem separation first.</p> : null}
      <div className="mt-4 rounded-dropzone border border-border bg-background p-3 font-mono text-xs text-text-muted">
        <p className="mb-2 uppercase tracking-[0.2em]">Filename preview</p>
        {previews.map((preview) => (
          <p key={preview}>{preview}</p>
        ))}
      </div>
      {isExporting ? <progress className="mt-4 h-2 w-full accent-accent" max={100} value={progress} /> : null}
      {exportError ? (
        <p className="mt-4 rounded-dropzone border border-border bg-background px-3 py-2 font-body text-sm text-accent" role="alert">
          {exportError}
        </p>
      ) : null}
      {lastVerification ? (
        <div className="mt-4 rounded-dropzone border border-border bg-background p-3 font-mono text-xs text-text-muted">
          <p className="mb-2 uppercase tracking-[0.2em]">{lastVerification.passed ? "Export verified" : "Export verification issues"}</p>
          <ul className="space-y-1">
            {lastVerification.checks.map((check) => (
              <li key={check.id} className={check.passed ? "text-text-muted" : "text-accent"}>
                {check.passed ? "✓" : "✗"} {check.label}: {check.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <button type="button" className="mt-4 rounded-dropzone bg-accent px-5 py-3 font-mono text-xs uppercase text-background" onClick={handleExport} disabled={isExporting || Boolean(includeStems && !hasStems)}>
        Export - {previews.length} files
      </button>
    </section>
  );
}
