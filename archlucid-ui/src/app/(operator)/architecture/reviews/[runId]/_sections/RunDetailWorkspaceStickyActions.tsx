"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  REVIEW_DETAIL_TAB_PARAM,
  buildReviewDetailTabHref,
  resolveReviewDetailTab,
} from "@/lib/review-detail-workspace-tabs";

import { contextualizeReviewPackagePrimaryActionForActiveTab } from "./contextualize-review-package-primary-action";
import { ReviewPackagePrimaryAction } from "./ReviewPackagePrimaryAction";
import type { ResolveReviewPackagePrimaryActionInput } from "./resolve-review-package-primary-action";
import type { ReviewPackagePrimaryAction as ReviewPackagePrimaryActionModel } from "./resolve-review-package-primary-action";

export type RunDetailWorkspaceStickyActionsProps = {
  readonly runId: string;
  readonly primaryAction: ReviewPackagePrimaryActionModel;
  readonly primaryActionContext: ResolveReviewPackagePrimaryActionInput;
  readonly commitBlockedReason: string | null;
  readonly showProgressTracker: boolean;
  readonly manifestId: string | null | undefined;
};

/** Compact review actions below the page title — not a sticky strip above the header. */
export function RunDetailWorkspaceStickyActions(
  props: RunDetailWorkspaceStickyActionsProps,
): React.JSX.Element {
  const searchParams = useSearchParams();
  const activeTab = resolveReviewDetailTab(searchParams.get(REVIEW_DETAIL_TAB_PARAM));
  const contextualPrimaryAction = contextualizeReviewPackagePrimaryActionForActiveTab(
    props.primaryAction,
    activeTab,
    props.primaryActionContext,
  );

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
        {props.manifestId && activeTab !== "decisions-remediation" ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/governance/approval-queue?runId=${encodeURIComponent(props.runId)}#governance-approval-requests`}>
              Record decision
            </Link>
          </Button>
        ) : null}
      </div>
      <ReviewPackagePrimaryAction
        action={contextualPrimaryAction}
        runId={props.runId}
        hasGoldenManifest={Boolean(props.manifestId)}
        commitBlockedReason={props.commitBlockedReason}
      />
    </div>
  );
}
