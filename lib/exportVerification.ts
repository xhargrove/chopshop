import { MILLISECONDS_PER_SECOND } from "@/lib/constants";
import { generateRekordboxXml } from "@/lib/export/rekordboxXml";
import { generateSeratoCueExport } from "@/lib/export/seratoExport";
import type { AudioSession } from "@/types/audio";

export interface ExportVerificationCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ExportVerificationReport {
  passed: boolean;
  checks: ExportVerificationCheck[];
}

const msTolerance = 2;

export const verifySessionExports = (session: AudioSession): ExportVerificationReport => {
  const checks: ExportVerificationCheck[] = [];
  const durationMs = Math.round(session.file.durationSeconds * MILLISECONDS_PER_SECOND);

  session.cuePoints.forEach((cue) => {
    const positionMs = Math.round(cue.position * MILLISECONDS_PER_SECOND);
    checks.push({
      id: `cue-${cue.id}`,
      label: `Cue ${cue.hotkey ?? "?"} in range`,
      passed: positionMs >= 0 && positionMs <= durationMs,
      detail: `${positionMs}ms / ${durationMs}ms`,
    });
  });

  session.regions.forEach((region) => {
    checks.push({
      id: `region-${region.id}`,
      label: `${region.label} region order`,
      passed: region.start <= region.end,
      detail: `${region.start.toFixed(3)}s → ${region.end.toFixed(3)}s`,
    });
  });

  session.bleepRegions.forEach((region) => {
    checks.push({
      id: `bleep-${region.id}`,
      label: `Bleep ${region.label}`,
      passed: region.end > region.start,
      detail: `${region.start.toFixed(3)}s → ${region.end.toFixed(3)}s`,
    });
  });

  try {
    const serato = generateSeratoCueExport(session, "1970-01-01T00:00:00.000Z");
    serato.cuePoints.forEach((cue) => {
      const sessionCue = session.cuePoints.find((candidate) => candidate.hotkey === cue.index);
      const expectedMs = sessionCue ? Math.round(sessionCue.position * MILLISECONDS_PER_SECOND) : null;
      checks.push({
        id: `serato-cue-${cue.index}`,
        label: `Serato cue ${cue.index} timing`,
        passed: expectedMs === null || Math.abs(expectedMs - cue.positionMs) <= msTolerance,
        detail: `export ${cue.positionMs}ms vs session ${expectedMs ?? "n/a"}ms`,
      });
    });

    if (serato.loop) {
      const loopRegion = session.regions.find((region) => region.type === "loop");
      const expectedIn = loopRegion ? Math.round(loopRegion.start * MILLISECONDS_PER_SECOND) : null;
      const expectedOut = loopRegion ? Math.round(loopRegion.end * MILLISECONDS_PER_SECOND) : null;
      checks.push({
        id: "serato-loop",
        label: "Serato loop timing",
        passed:
          expectedIn !== null &&
          expectedOut !== null &&
          Math.abs(expectedIn - serato.loop.inMs) <= msTolerance &&
          Math.abs(expectedOut - serato.loop.outMs) <= msTolerance,
        detail: `in ${serato.loop.inMs}ms out ${serato.loop.outMs}ms`,
      });
    }
  } catch (error) {
    checks.push({
      id: "serato-generate",
      label: "Serato JSON generation",
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const xml = generateRekordboxXml(session);
    const markCount = (xml.match(/POSITION_MARK/g) ?? []).length;
    const loopMarkCount = session.regions.some((region) => region.type === "loop") ? 1 : 0;
    const expectedMarks =
      session.cuePoints.length + session.transitionCues.length + loopMarkCount;
    checks.push({
      id: "rekordbox-marks",
      label: "Rekordbox cue marks",
      passed: markCount === expectedMarks,
      detail: `${markCount} marks, expected ${expectedMarks}`,
    });
  } catch (error) {
    checks.push({
      id: "rekordbox-generate",
      label: "Rekordbox XML generation",
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    passed: checks.every((check) => check.passed),
    checks,
  };
};
