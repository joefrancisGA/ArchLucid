"use client";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useWhatIfBranchAutoCompare } from "@/hooks/useWhatIfBranchAutoCompare";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { DRAFT_BRANCH_AUTO_COMPARE_QUERY_KEY } from "@/lib/draft-branch-auto-compare";
import { DRAFT_BRANCH_PARENT_RUN_QUERY_KEY } from "@/lib/draft-branch-compare-navigation";

export type WhatIfBranchCompareBannerProps = {
  readonly currentRunId: string;
  readonly hasCurrentManifest: boolean;
};

/**
 * Surfaces Compare when run detail was opened with `?parentRunId=` after a what-if branch submit (R12).
 * When `?autoCompare=1` is present, polls until both manifests commit then opens Compare.
 */
export function WhatIfBranchCompareBanner(props: WhatIfBranchCompareBannerProps) {
  const searchParams = useSearchParams();
  const parentRunId = searchParams.get(DRAFT_BRANCH_PARENT_RUN_QUERY_KEY)?.trim() ?? "";
  const autoCompareEnabled = searchParams.get(DRAFT_BRANCH_AUTO_COMPARE_QUERY_KEY) === "1";

  const autoComparePhase = useWhatIfBranchAutoCompare({
    enabled: autoCompareEnabled && parentRunId.length > 0,
    parentRunId,
    currentRunId: props.currentRunId,
    hasCurrentManifest: props.hasCurrentManifest,
  });

  if (parentRunId.length === 0) {
    return null;
  }

  if (parentRunId === props.currentRunId) {
    return null;
  }

  const compareHref = comparePageHrefAdaptive(parentRunId, props.currentRunId);

  let statusMessage =
    "This review is a what-if branch — compare it to the parent review once both reviews are finalized.";

  if (autoCompareEnabled && autoComparePhase === "polling") {
    statusMessage = "Waiting for both reviews to finalize — Compare will open automatically when ready.";
  }

  if (autoCompareEnabled && autoComparePhase === "redirecting") {
    statusMessage = "Both reviews are ready — opening Compare…";
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", DESIGN_TOKENS.callout.info, OPERATOR_TYPOGRAPHY.body)}
      data-testid="what-if-branch-compare-banner"
    >
      <span className="text-neutral-800 dark:text-neutral-100">{statusMessage}</span>
      <Button variant="secondary" size="sm" asChild>
        <Link href={compareHref} data-testid="what-if-branch-compare-link">
          Compare parent vs branch
        </Link>
      </Button>
    </div>
  );
}
