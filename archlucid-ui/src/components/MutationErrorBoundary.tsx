"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { isClientDiagnosticsBannerEnabled } from "@/lib/client-diagnostics-banner-policy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { reportClientError } from "@/lib/error-telemetry";
import { cn } from "@/lib/utils";

type MutationErrorBoundaryState = { hasError: boolean; message: string | null; stack: string | null };

/**
 * Catches client-side throw/render failures so governance and finding flows do not
 * show a white screen; mutations should still use explicit API error toasts.
 */
export class MutationErrorBoundary extends Component<
  { children: ReactNode; title?: string },
  MutationErrorBoundaryState
> {
  public state: MutationErrorBoundaryState = { hasError: false, message: null, stack: null };

  public static getDerivedStateFromError(error: Error): MutationErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Something went wrong.",
      stack: error.stack ?? null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("MutationErrorBoundary", error, errorInfo.componentStack);
    reportClientError(error, {
      source: "mutation-error-boundary",
      componentStack: (errorInfo.componentStack ?? "").slice(0, 500),
    });
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      const showDetail =
        process.env.NODE_ENV === "development" || isClientDiagnosticsBannerEnabled();
      const detail =
        showDetail && this.state.message !== null
          ? this.state.message
          : "Something went wrong while loading this view. Try again, or go back and reopen the page.";

      return (
        <div
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50 p-4",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="alert"
        >
          <p className="m-0 font-semibold">{this.props.title ?? "This view failed to render"}</p>
          <p className={cn("m-0 mt-2 opacity-90", OPERATOR_TYPOGRAPHY.body)}>{detail}</p>
          {showDetail && this.state.stack !== null ? (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-neutral-100 p-2 font-mono text-[11px] text-al-text-primary dark:bg-neutral-900">
              {this.state.stack}
            </pre>
          ) : null}
        </div>
      );
    }

    return this.props.children;
  }
}
