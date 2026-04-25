"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 select-none p-8 text-center">
          <div className="text-4xl">⚠️</div>
          <div className="text-sm font-medium text-gray-600">Flowchart render error</div>
          <div className="text-xs font-mono text-red-400 max-w-xs break-all">
            {this.state.error.message}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-xs px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors mt-1"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
