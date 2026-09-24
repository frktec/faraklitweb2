import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
          <div className="max-w-[400px] text-center">
            <h1 className="text-[20px] font-semibold text-ink-950">Bir şeyler ters gitti</h1>
            <p className="mt-2 text-[16px] text-ink-500">
              Sayfa yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-5"
            >
              Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
