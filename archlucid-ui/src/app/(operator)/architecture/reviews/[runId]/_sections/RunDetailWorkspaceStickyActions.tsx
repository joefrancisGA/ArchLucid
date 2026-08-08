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

/** Compact sticky review actions for desktop workspace layout. */
export function RunDetailWorkspaceStickyActions(
  props: RunDetailWorkspaceStickyActionsProps,
): React.JSX.Element {
  return (
    <div
      className="sticky top-28 z-20 hidden rounded-lg border border-neutral-200 bg-white/95 p-3 backdrop-blur lg:flex lg:items-center lg:justify-between dark:border-neutral-800 dark:bg-neutral-950/95"
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
