interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label = "Loading" }: LoadingSpinnerProps) {
  return (
    <span className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-text-muted" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
