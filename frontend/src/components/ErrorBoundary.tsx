import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CampusLend ErrorBoundary] Uncaught runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle size={28} />
            </div>

            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Something went wrong
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              CampusLend encountered an unexpected issue while loading this page.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={this.handleReload}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 active:scale-98 transition"
              >
                <RefreshCw size={15} />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 py-3 px-4 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                <Home size={15} />
                Home
              </button>
            </div>

            {this.state.error && (
              <details className="mt-5 text-left text-xs">
                <summary className="cursor-pointer font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  Diagnostic details
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-100 p-3 font-mono text-[11px] text-rose-700 dark:bg-slate-950 dark:text-rose-400">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
