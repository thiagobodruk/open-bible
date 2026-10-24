import { Component, type ErrorInfo, type ReactNode } from 'react';
import { tr } from '../i18n';

interface State {
  error: Error | null;
}

/** Última rede de proteção: se algo quebrar ao desenhar a tela, mostra o erro em vez de deixar a página em branco. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="welcome crash" role="alert">
        <h1>{tr('errorTitle')}</h1>
        <p>{tr('errorBody')}</p>
        <code>{error.message}</code>
        <button className="btn primary" onClick={() => location.reload()}>{tr('errorReload')}</button>
      </main>
    );
  }
}
