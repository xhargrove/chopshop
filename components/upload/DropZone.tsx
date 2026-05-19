"use client";

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ACCEPTED_AUDIO_EXTENSIONS } from "@/lib/constants";
import { getAcceptedAudioDescription, validateAudioFile } from "@/lib/audioFile";

interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  isLoading?: boolean;
}

const getFirstFile = (files: FileList | null): File | null => files?.item(0) ?? null;

export function DropZone({ onFileAccepted, isLoading = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | null): void => {
      if (!file) {
        return;
      }

      const validation = validateAudioFile(file);

      if (!validation.isValid) {
        setError(validation.error);
        return;
      }

      setError(null);
      onFileAccepted(file);
    },
    [onFileAccepted],
  );

  const openFilePicker = useCallback((): void => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      handleFile(getFirstFile(event.target.files));
      event.target.value = "";
    },
    [handleFile],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      setIsDragActive(false);
      handleFile(getFirstFile(event.dataTransfer.files));
    },
    [handleFile],
  );

  const borderClass = isDragActive ? "border-accent" : "border-border";

  return (
    <div className="w-full max-w-3xl">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={ACCEPTED_AUDIO_EXTENSIONS.join(",")}
        onChange={handleInputChange}
        aria-label="Choose an audio file"
      />
      <button
        type="button"
        className={`flex min-h-dropzone w-full flex-col items-center justify-center rounded-dropzone border border-dashed ${borderClass} bg-surface px-8 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background`}
        onClick={openFilePicker}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="Drop or browse for a track"
      >
        <svg className="h-10 w-10 text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 16V4m0 0 5 5m-5-5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="mt-5 font-display text-drop-title text-text-primary">Drop a track</span>
        <span className="mt-2 font-mono text-sm uppercase tracking-[0.2em] text-text-muted">{getAcceptedAudioDescription()}</span>
        {isLoading ? <span className="mt-6"><LoadingSpinner label="Reading metadata" /></span> : null}
      </button>
      {error ? (
        <p className="mt-4 rounded-dropzone border border-border bg-surface px-4 py-3 font-body text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
