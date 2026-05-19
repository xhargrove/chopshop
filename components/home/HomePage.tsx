"use client";

import { useCallback, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { SessionView } from "@/components/session/SessionView";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { DropZone } from "@/components/upload/DropZone";
import { useAudioStore } from "@/store/audioStore";

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function HomePage() {
  const session = useAudioStore((state) => state.session);
  const loadFile = useAudioStore((state) => state.loadFile);
  const clearSession = useAudioStore((state) => state.clearSession);
  const setPlayhead = useAudioStore((state) => state.setPlayhead);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileAccepted = useCallback(
    async (file: File): Promise<void> => {
      setIsLoading(true);
      setUploadError(null);

      try {
        await loadFile(file);
      } catch (error) {
        setUploadError(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [loadFile],
  );

  return (
    <AppShell>
      {!session ? (
        <ErrorBoundary fallbackTitle="Upload area failed" fallbackMessage="Refresh the page to try loading a track again.">
          <section className="flex flex-1 flex-col items-center justify-center" aria-label="Upload a track">
            <DropZone onFileAccepted={(file) => void handleFileAccepted(file)} isLoading={isLoading} />
            {uploadError ? (
              <p className="mt-4 w-full max-w-3xl rounded-dropzone border border-border bg-surface px-4 py-3 font-body text-sm text-accent" role="alert">
                {uploadError}
              </p>
            ) : null}
          </section>
        </ErrorBoundary>
      ) : (
        <ErrorBoundary fallbackTitle="Session failed" fallbackMessage="Clear the track and load it again.">
          <SessionView session={session} onClearSession={clearSession} onPlayheadChange={setPlayhead} />
        </ErrorBoundary>
      )}
    </AppShell>
  );
}
