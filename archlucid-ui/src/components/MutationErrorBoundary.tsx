"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type MutationErrorBoundaryState = { hasError: boolean; message: string | null };

/**
 * Catches client-side throw/render failures so governance and finding flows do not
 * show a white screen; mutations should still use explicit API error toasts.
 */
export class MutationErrorBoundary extends Component<
  { children: ReactNode; title?: string },
  MutationErrorBoundaryState
> {
  public state: MutationErrorBoundaryState = { hasError: false, message: null };

  public static getDerivedStateFromError(error: Error): MutationErrorBoundaryState {
    return { hasError: true, message: error.message || "Something went wrong." };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("MutationErrorBoundary", error, errorInfo.componentStack);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === "development";
      const detail =
        isDev && this.state.message !== null
          ? this.state.message
          : "Something went wrong while loading this view. Try again, or go back and reopen the page.";

      return (
        <div className="rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50 p-4 text-sm" role="alert">
          <p className="m-0 font-semibold">{this.props.title ?? "This view failed to render"}</p>
          <p className="m-0 mt-2 text-sm opacity-90">{detail}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
