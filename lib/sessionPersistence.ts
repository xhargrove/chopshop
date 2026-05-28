import { SESSION_SNAPSHOT_VERSION, type PersistedFileMeta, type PersistedSessionPayload, type SessionSnapshot } from "@/types/sessionSnapshot";
import type { AudioSession, EditorSettings } from "@/types/audio";

const STORAGE_KEY = "chopshop.session.v1";

export const buildFileKey = (file: File): string => `${file.name}|${file.size}|${file.lastModified}`;

const toPersistedFileMeta = (file: File, session: AudioSession): PersistedFileMeta => ({
  name: file.name,
  format: session.file.format,
  sizeBytes: file.size,
  durationSeconds: session.file.durationSeconds,
  bpm: session.file.bpm,
  key: session.file.key,
  beatOffset: session.file.beatOffset,
  lastModified: file.lastModified,
});

const toPersistedSession = (session: AudioSession): PersistedSessionPayload => ({
  regions: session.regions.map((region) => ({ ...region })),
  cuePoints: session.cuePoints.map((cue) => ({ ...cue })),
  bleepRegions: session.bleepRegions.map((region) => ({ ...region })),
  transitionCues: session.transitionCues.map((cue) => ({ ...cue })),
  acapellaSwap: session.acapellaSwap ? { ...session.acapellaSwap } : null,
  playheadPosition: session.playheadPosition,
  bpmSource: session.bpmSource,
  keySource: session.keySource,
  autoBpm: session.autoBpm,
  autoKey: session.autoKey,
});

export const createSessionSnapshot = (session: AudioSession, editorSettings: EditorSettings, file: File): SessionSnapshot => ({
  version: SESSION_SNAPSHOT_VERSION,
  savedAt: Date.now(),
  fileKey: buildFileKey(file),
  fileMeta: toPersistedFileMeta(file, session),
  session: toPersistedSession(session),
  editorSettings: { ...editorSettings },
});

export const saveSessionSnapshot = (snapshot: SessionSnapshot): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};

export const loadSessionSnapshot = (): SessionSnapshot | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionSnapshot;

    if (parsed.version !== SESSION_SNAPSHOT_VERSION) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const clearSessionSnapshot = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

export const findMatchingSnapshot = (file: File): SessionSnapshot | null => {
  const snapshot = loadSessionSnapshot();

  if (!snapshot || snapshot.fileKey !== buildFileKey(file)) {
    return null;
  }

  return snapshot;
};

export const mergeSnapshotIntoSession = (session: AudioSession, snapshot: SessionSnapshot): AudioSession => ({
  ...session,
  file: {
    ...session.file,
    bpm: snapshot.fileMeta.bpm,
    key: snapshot.fileMeta.key,
    beatOffset: snapshot.fileMeta.beatOffset,
  },
  ...snapshot.session,
});
