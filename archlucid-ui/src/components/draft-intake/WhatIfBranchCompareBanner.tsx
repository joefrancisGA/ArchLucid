"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { DRAFT_BRANCH_PARENT_RUN_QUERY_KEY } from "@/lib/draft-branch-compare-navigation";

export type WhatIfBranchCompareBannerProps = {
  readonly currentRunId: string;
};

/**
 * Surfaces Compare when run detail was opened with `?parentRunId=` after a what-if branch submit (R12).
 */
export function WhatIfBranchCompareBanner(props: WhatIfBranchCompareBannerProps) {
  const searchParams = useSearchParams();
  const parentRunId = searchParams.get(DRAFT_BRANCH_PARENT_RUN_QUERY_KEY)?.trim() ?? "";

  if (parentRunId.length === 0) {
    return null;
  }

  if (parentRunId === props.currentRunId) {
    return null;
  }

  const compareHref = comparePageHrefAdaptive(parentRunId, props.currentRunId);

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm dark:border-sky-800 dark:bg-sky-950/40"
      data-testid="what-if-branch-compare-banner"
    >
      <span className="text-neutral-800 dark:text-neutral-100">
        This review is a what-if branch — compare it to the parent run once both manifests are finalized.
      </span>
      <Button variant="secondary" size="sm" asChild>
        <Link href={compareHref} data-testid="what-if-branch-compare-link">
          Compare parent vs branch
        </Link>
      </Button>
    </div>
  );
}
