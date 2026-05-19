import { type ReactNode } from "react";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <ErrorBoundary fallbackTitle="Header failed" fallbackMessage="The app chrome could not render.">
        <header className="flex h-12 items-center justify-between border-b border-border bg-surface px-6">
          <a href="/" className="font-display text-2xl tracking-[0.12em] text-text-primary" aria-label="Chop Shop home">
            CHOP SHOP
          </a>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">DJ Edit Lab</p>
        </header>
      </ErrorBoundary>
      <main className="mx-auto flex min-h-[calc(100vh-theme(spacing.12))] w-full max-w-6xl flex-col px-6 py-10">{children}</main>
    </div>
  );
}
