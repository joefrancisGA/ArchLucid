"use client";

import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ApprovalQueueTriageFirstPendingTarget } from "@/lib/governance/resolve-approval-queue-triage-first-pending";
import { governanceEnvironmentPairDisplay } from "@/app/(operator)/governance/_sections/governance-workflow-helpers";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archlucid_approval_queue_triage_first_pending_strip_dismissed_v1";

export type ApprovalQueueTriageFirstPendingStripProps = {
  readonly target: ApprovalQueueTriageFirstPendingTarget;
  readonly onReviewDecision: (approvalRequestId: string) => void;
};

/** Dismissible strip routing operators to the oldest pending approval request. */
export function ApprovalQueueTriageFirstPendingStrip(
  props: ApprovalQueueTriageFirstPendingStripProps,
): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    setVisible(false);
  }, []);

  const scrollToRequest = useCallback((): void => {
    document
      .querySelector(`[data-approval-request-id="${props.target.approvalRequestId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [props.target.approvalRequestId]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="approval-queue-triage-first-pending-strip"
      role="note"
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 font-medium text-al-text-primary">Start with the oldest pending request</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">{props.target.manifestVersion}</span>{" "}
          {governanceEnvironmentPairDisplay(props.target.sourceEnvironment, props.target.targetEnvironment)}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="approval-queue-triage-first-pending-open"
          onClick={scrollToRequest}
        >
          Open request
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="approval-queue-triage-first-pending-review"
          onClick={() => {
            scrollToRequest();
            props.onReviewDecision(props.target.approvalRequestId);
          }}
        >
          Review decision
        </Button>
        <DismissControl className="h-7" onDismiss={onDismiss} />
      </div>
    </div>
  );
}
