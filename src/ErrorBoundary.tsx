import { Component, type ErrorInfo, type ReactNode } from 'react';
import { strings, type Lang } from './i18n';
import { loadState } from './storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = (): void => {
    try {
      localStorage.removeItem('value-compare:state:v1');
    } catch {
      // Storage might not be accessible
    }
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      let lang: Lang = 'en';
      try {
        lang = loadState().lang;
      } catch {
        lang = 'en';
      }
      const t = strings[lang] ?? strings.en;

      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg, #ffffff)',
            color: 'var(--text, #111111)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '400px',
              padding: '32px 24px',
              border: '1px solid var(--border, #111111)',
              borderRadius: '16px',
              backgroundColor: 'var(--surface, #ffffff)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: '1.4rem' }}>{t.errorBoundaryTitle}</h2>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                minHeight: '44px',
                padding: '0 24px',
                fontSize: '1rem',
                borderRadius: '999px',
                border: '0',
                backgroundColor: 'var(--text, #111111)',
                color: 'var(--bg, #ffffff)',
                cursor: 'pointer',
              }}
            >
              {t.errorBoundaryReset}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
