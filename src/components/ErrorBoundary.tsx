import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** O que mostrar no lugar do conteúdo que quebrou. `reset` tenta desenhar o conteúdo de novo. */
  fallback: (reset: () => void) => ReactNode;
}

/** Contém uma falha de desenho: só esta parte da tela é trocada, o resto do app segue funcionando. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    return this.state.failed ? this.props.fallback(() => this.setState({ failed: false })) : this.props.children;
  }
}
