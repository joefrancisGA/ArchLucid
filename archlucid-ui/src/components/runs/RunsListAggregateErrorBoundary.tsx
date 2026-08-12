"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { RunsListClient, type RunsListClientProps } from "@/app/(operator)/architecture/reviews/RunsListClient";
import { OperatorDemoStaticBanner } from "@/components/operator/OperatorDemoStaticBanner";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { getBuyerSafeReviewsTableLink } from "@/lib/buyer/buyer-safe-review-navigation";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import type { RunSummary } from "@/types/authority";

function runListPrimaryTitle(run: RunSummary): string {
  const d = run.description?.trim() ?? "";

  if (d.length > 0) {
    return d;
  }

  return "Untitled review";
}

function RunsListMinimalDemoTable({ runs }: { readonly runs: RunSummary[] }) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <EnterpriseTable ariaLabel="Sample reviews fallback list" className={OPERATOR_TYPOGRAPHY.body}>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {runs.map((run) => {
          const action = getBuyerSafeReviewsTableLink(run.runId);

          return (
            <EnterpriseTableRow key={run.runId}>
              <EnterpriseTableCell className="max-w-[min(100vw,28rem)] align-top">
                <span className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {runListPrimaryTitle(run)}
                </span>
                {buyerPolishedShell ? null : (
                  <code className={cn("mt-1 block break-all font-mono text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {run.runId}
                  </code>
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell className="whitespace-nowrap align-top">
                <Link href={action.href} className="font-medium text-teal-800 underline dark:text-teal-300">
                  {action.label}
                </Link>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

type RunsListAggregateErrorBoundaryProps = RunsListClientProps;

type RunsListAggregateErrorBoundaryState = {
  hasError: boolean;
  message: string | null;
};

/**
 * Wraps the runs grid so catastrophic client failures can recover with a minimal demo-friendly table instead of swapping the `/runs` route error segment.
 */
export class RunsListAggregateErrorBoundary extends Component<
  RunsListAggregateErrorBoundaryProps,
  RunsListAggregateErrorBoundaryState
> {
  public state: RunsListAggregateErrorBoundaryState = { hasError: false, message: null };

  public static getDerivedStateFromError(error: Error): RunsListAggregateErrorBoundaryState {
    return { hasError: true, message: error.message || "Reviews list encountered an unexpected error." };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("RunsListAggregateErrorBoundary", error, errorInfo.componentStack);
  }

  public override render(): ReactNode {
    if (!this.state.hasError) {
      return <RunsListClient {...this.props} />;
    }

    const demoPaged = tryStaticDemoRunSummariesPaged(this.props.projectId, { afterAuthorityListFailure: true });

    if (demoPaged !== null && demoPaged.items.length > 0) {
      return (
        <div className="mt-4 space-y-4" role="alert">
          <p className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 m-0 max-w-prose px-3 py-2", OPERATOR_TYPOGRAPHY.body)}>
            <strong className="font-semibold">Showing sample run data.</strong> The live grid hit a client rendering
            issue; demo mode substitutes the Claims Intake row so navigation stays usable.
          </p>
          <OperatorDemoStaticBanner />
          <RunsListMinimalDemoTable runs={demoPaged.items} />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false, message: null });
            }}
          >
            Retry live grid
          </Button>
        </div>
      );
    }

    const isDev = process.env.NODE_ENV === "development";

    return (
      <div
        className={cn("rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50 mt-6 max-w-xl space-y-3 p-4", OPERATOR_TYPOGRAPHY.body)}
        role="alert"
      >
        <p className="m-0 font-semibold">Reviews could not render</p>
        {isDev && this.state.message !== null ? (
          <p className={cn("m-0 font-mono opacity-95", OPERATOR_TYPOGRAPHY.helper)}>{this.state.message}</p>
        ) : (
          <p className={cn("m-0 opacity-95", OPERATOR_TYPOGRAPHY.body)}>
            This review list hit an unexpected error. You can retry or open Reviews for a fresh start.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              this.setState({ hasError: false, message: null });
            }}
          >
            Retry
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/architecture/reviews">Back to reviews</Link>
          </Button>
        </div>
      </div>
    );
  }
}
