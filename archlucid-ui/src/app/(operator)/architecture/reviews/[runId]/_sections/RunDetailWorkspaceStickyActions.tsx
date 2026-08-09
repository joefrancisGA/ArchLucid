"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { OPERATOR_LINK, OPERATOR_SHELL_STICKY_TOP_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_DETAIL_TAB_PARAM,
  buildReviewDetailTabHref,
  resolveReviewDetailTab,
} from "@/lib/review-detail-workspace-tabs";
import { cn } from "@/lib/utils";

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

/**
 * Compact review actions below the page title, pinned under the shell header while the operator scrolls.
 *
 * The review workspace runs several viewports deep on the Evidence and Findings tabs, so an action bar
 * that scrolls away leaves the recommended next step unreachable from where the decision is formed.
 */
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
  const approvalBlocked =
    props.commitBlockedReason !== null || props.primaryActionContext.blockingFindingCount > 0;
  const blockingHelperText =
    props.commitBlockedReason ??
    (props.primaryActionContext.blockingFindingCount > 0
      ? `${props.primaryActionContext.blockingFindingCount} unresolved finding${
          props.primaryActionContext.blockingFindingCount === 1 ? "" : "s"
        } currently block approval.`
      : null);
  const findingsHref = buildReviewDetailTabHref(props.runId, "findings");

  return (
    <div
      className={cn(
        "sticky z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-neutral-800 dark:bg-neutral-950/95 dark:supports-[backdrop-filter]:bg-neutral-950/80",
        OPERATOR_SHELL_STICKY_TOP_CLASS,
      )}
      data-testid="run-detail-sticky-actions"
    >
      <div className="min-w-0 flex-1 space-y-1">
        {approvalBlocked && blockingHelperText !== null ? (
          <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>
            {blockingHelperText}{" "}
            <Link className={OPERATOR_LINK.nav} href={findingsHref}>
              Resolve blocking finding first
            </Link>
          </p>
        ) : props.manifestId && activeTab !== "decisions-remediation" ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Ready to record a governance decision?{" "}
            <Link
              className={OPERATOR_LINK.nav}
              href={`/governance/approval-queue?runId=${encodeURIComponent(props.runId)}#governance-approval-requests`}
            >
              Open approval queue
            </Link>
          </p>
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
