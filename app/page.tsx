import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ACCEPTED_AUDIO_EXTENSIONS, MAX_FILE_SIZE_MB } from "@/lib/constants";

export default function Home() {
  return (
    <AppShell>
      <ErrorBoundary fallbackTitle="Upload area failed" fallbackMessage="Refresh the page to try loading a track again.">
        <section className="flex flex-1 items-center justify-center">
          <div className="flex min-h-dropzone w-full max-w-3xl flex-col items-center justify-center rounded-dropzone border border-dashed border-border bg-surface px-8 text-center">
            <svg className="h-10 w-10 text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 16V4m0 0 5 5m-5-5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h1 className="mt-5 font-display text-drop-title text-text-primary">Drop a track</h1>
            <p className="mt-2 font-mono text-sm uppercase tracking-[0.2em] text-text-muted">
              {ACCEPTED_AUDIO_EXTENSIONS.join(" ")} · {MAX_FILE_SIZE_MB}MB max
            </p>
          </div>
        </section>
      </ErrorBoundary>
    </AppShell>
  );
}
