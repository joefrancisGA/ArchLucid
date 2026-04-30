"use client";

import { Component, type ErrorInfo, type ReactElement } from "react";

type RunTableRowErrorBoundaryProps = {
  runId: string;
  children: ReactElement;
};

type RunTableRowErrorBoundaryState = { hasError: boolean };

/**
 * Isolates a single `<tr>` from render failures elsewhere in the runs list —
 * renders a collapsed error row so the remainder of the table remains usable.
 */
export class RunTableRowErrorBoundary extends Component<
  RunTableRowErrorBoundaryProps,
  RunTableRowErrorBoundaryState
> {
  public state: RunTableRowErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): RunTableRowErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("RunTableRowErrorBoundary", this.props.runId, error, errorInfo.componentStack);
  }

  public override render(): ReactElement {
    if (this.state.hasError) {
      return (
        <tr data-testid={`runs-row-error-${this.props.runId}`}>
          <td className="px-3 py-2 align-top text-sm text-neutral-700 dark:text-neutral-200" colSpan={3}>
            <span className="font-semibold">This run row could not be displayed.</span>{" "}
            <span className="font-mono text-xs text-neutral-500">({this.props.runId})</span>
          </td>
        </tr>
      );
    }

    return this.props.children;
  }
}
