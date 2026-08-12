"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AiUsageSectionLoadState } from "@/lib/ai-usage-dashboard-model";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly state: AiUsageSectionLoadState;
  readonly title: string;
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
  readonly errorMessage?: string;
  readonly delayedMessage?: string;
  readonly permissionMessage?: string;
  readonly inactiveMessage?: string;
  readonly onRetry?: () => void;
  /** Only rendered in the ready state, so error/empty/loading call sites can omit it. */
  readonly children?: ReactNode;
  readonly skeleton?: ReactNode;
  readonly testId?: string;
};

function DefaultSkeleton() {
  return (
    <div className="space-y-3" data-testid="ai-usage-section-skeleton">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function AiUsageSectionState(props: Props) {
  const testId = props.testId ?? "ai-usage-section-state";

  if (props.state === "loading") {
    return <div data-testid={testId}>{props.skeleton ?? <DefaultSkeleton />}</div>;
  }

  if (props.state === "permission_restricted") {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        role="status"
        data-testid={`${testId}-permission-restricted`}
      >
        {props.permissionMessage
          ?? "Budget details and recent AI activity require Execute authority. Ask a workspace administrator for access."}
      </p>
    );
  }

  if (props.state === "inactive") {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status" data-testid={`${testId}-inactive`}>
        {props.inactiveMessage ?? "Monthly AI budget monitoring is not enabled for this workspace."}
      </p>
    );
  }

  if (props.state === "delayed") {
    return (
      <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} role="status" data-testid={`${testId}-delayed`}>
        {props.delayedMessage ?? "Usage data is still syncing. Recent activity may appear shortly."}
      </p>
    );
  }

  if (props.state === "error") {
    return (
      <div className="space-y-3" data-testid={`${testId}-error`}>
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {props.errorMessage ?? `Could not load ${props.title.toLowerCase()}.`}
        </p>
        {props.onRetry !== undefined ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void props.onRetry?.()}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  if (props.state === "empty") {
    return (
      <div
        className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-6 dark:border-neutral-700 dark:bg-neutral-900/30"
        data-testid={`${testId}-empty`}
      >
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {props.emptyTitle ?? `No ${props.title.toLowerCase()} yet`}
        </h3>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {props.emptyDescription
            ?? "No AI usage has been recorded for this billing period. Activity will appear here after reviews, evidence checks, or Q&A workflows run."}
        </p>
      </div>
    );
  }

  return <div data-testid={testId}>{props.children}</div>;
}
