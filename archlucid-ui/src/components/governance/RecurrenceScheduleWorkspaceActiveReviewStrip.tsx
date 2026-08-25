"use client";

import Link from "next/link";

import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { Button } from "@/components/ui/button";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RecurrenceScheduleWorkspaceActiveReviewStripProps = {
  readonly onScheduleFromWorkspaceActive: (runId: string) => void;
};

/** Empty-state strip routing operators to schedule recurrence from workspace active review. */
export function RecurrenceScheduleWorkspaceActiveReviewStrip(
  props: RecurrenceScheduleWorkspaceActiveReviewStripProps,
): React.JSX.Element | null {
  const workspaceRun = useWorkspaceActiveRun();
  const runId = workspaceRun.runId.trim();

  if (runId.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="recurrence-schedule-workspace-active-review-strip"
      role="note"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Schedule from workspace active review</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Use the finalized review you are working in as the recurrence source run.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="recurrence-schedule-workspace-active-schedule"
          onClick={() => {
            props.onScheduleFromWorkspaceActive(runId);
          }}
        >
          Create schedule
        </Button>
        <Button type="button" variant="outline" size="sm" asChild data-testid="recurrence-schedule-workspace-active-open">
          <Link href={reviewDetailPath(runId)}>Open review</Link>
        </Button>
      </div>
    </section>
  );
}
