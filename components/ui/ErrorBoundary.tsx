"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { logger } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render(): ReactNode {
    const { children, fallbackMessage, fallbackTitle } = this.props;

    if (this.state.hasError) {
      return (
        <section
          className="rounded-dropzone border border-border bg-surface p-6 text-text-primary"
          role="alert"
          aria-live="assertive"
        >
          <h2 className="font-display text-drop-title tracking-wide">{fallbackTitle ?? "Something slipped"}</h2>
          <p className="mt-2 max-w-xl font-body text-sm text-text-muted">
            {fallbackMessage ?? "Reload the page or try the action again."}
          </p>
        </section>
      );
    }

    return children;
  }
}
