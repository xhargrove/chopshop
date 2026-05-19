import { formatBPM, formatKey, formatTime } from "@/lib/format";
import type { AudioSession } from "@/types/audio";

interface SessionHeaderProps {
  session: AudioSession;
  totalDuration: number;
  onClearSession: () => void;
}

export function SessionHeader({ session, totalDuration, onClearSession }: SessionHeaderProps) {
  return (
    <header className="flex flex-col gap-3 rounded-dropzone border border-border bg-surface p-4 font-mono text-sm text-text-muted md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em]">Track</p>
        <h1 className="mt-1 max-w-3xl truncate text-lg text-text-primary">{session.file.name}</h1>
      </div>
      <dl className="flex flex-wrap gap-5">
        <div>
          <dt className="text-xs uppercase tracking-[0.2em]">BPM</dt>
          <dd className="mt-1 text-text-primary">{session.file.bpm ? formatBPM(session.file.bpm) : "--"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.2em]">Key</dt>
          <dd className="mt-1 text-text-primary">{session.file.key ? formatKey(session.file.key) : "--"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.2em]">Length</dt>
          <dd className="mt-1 text-text-primary">{formatTime(totalDuration)}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="rounded-dropzone border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-text-primary transition-colors hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        onClick={onClearSession}
        aria-label="Clear loaded track"
      >
        Clear
      </button>
    </header>
  );
}
