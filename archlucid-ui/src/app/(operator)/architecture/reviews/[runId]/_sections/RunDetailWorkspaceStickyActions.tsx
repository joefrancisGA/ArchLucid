"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { ReviewPackagePrimaryAction } from "./ReviewPackagePrimaryAction";
import type { ReviewPackagePrimaryAction as ReviewPackagePrimaryActionModel } from "./resolve-review-package-primary-action";

export type RunDetailWorkspaceStickyActionsProps = {
  readonly runId: string;
  readonly primaryAction: ReviewPackagePrimaryActionModel;
  readonly commitBlockedReason: string | null;
  readonly showProgressTracker: boolean;
  readonly manifestId: string | null | undefined;
};

/** Compact review actions below the page title — not a sticky strip above the header. */
export function RunDetailWorkspaceStickyActions(
  props: RunDetailWorkspaceStickyActionsProps,
): React.JSX.Element {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="run-detail-sticky-actions"
    >
      <div className="flex flex-wrap items-center gap-2">
        {props.showProgressTracker ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildReviewDetailTabHref(props.runId, "activity", { hash: "pipeline-timeline" })}>
              Continue review
            </Link>
          </Button>
        ) : null}
        {props.manifestId ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/governance/approval-queue?runId=${encodeURIComponent(props.runId)}#governance-approval-requests`}>
              Record decision
            </Link>
          </Button>
        ) : null}
      </div>
      <ReviewPackagePrimaryAction
        action={props.primaryAction}
        runId={props.runId}
        hasGoldenManifest={Boolean(props.manifestId)}
        commitBlockedReason={props.commitBlockedReason}
      />
    </div>
  );
}
