import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', maxWidth: 560, margin: '4rem auto' }}>
          <div className="card">
            <div className="card-title">Something went wrong</div>
            <p className="section-text" style={{ marginTop: '0.75rem' }}>
              The page hit an unexpected error. Try refreshing, or restart the backend if data looks out of date.
            </p>
            <p className="muted-text" style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>
              {this.state.message}
            </p>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: '1rem' }}
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
