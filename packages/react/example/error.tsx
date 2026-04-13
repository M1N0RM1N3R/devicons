import * as React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Icon rendering error:", error);
    console.error("Error info:", errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center flex flex-col items-center justify-center">
          <div className="text-red-500 text-sm">Failed to load icon</div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
