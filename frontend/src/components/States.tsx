interface ErrorStateProps {
  message: string;
  title?: string;
  hint?: string;
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="loading-state card">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message, title = 'Something went wrong', hint }: ErrorStateProps) {
  return (
    <div className="error-state-card card">
      <div className="error-icon">!</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {hint && <p className="error-hint">{hint}</p>}
      <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="empty-state card">
      <div className="empty-icon">∅</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
