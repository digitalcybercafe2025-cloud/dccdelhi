import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public props: Props;

    constructor(props: Props) {
        super(props);
        this.props = props;
    }

    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 text-center font-sans">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-white/10 space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Something went wrong</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                An unexpected issue occurred. We've logged this and you can safely reload.
                            </p>
                        </div>
                        {this.state.error?.message && (
                            <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-left text-[11px] font-mono text-red-600 dark:text-red-400 break-all max-h-28 overflow-y-auto">
                                {this.state.error.message}
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={this.handleReload}
                                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/25"
                            >
                                <RefreshCw className="w-4 h-4" /> Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <Home className="w-4 h-4" /> Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
