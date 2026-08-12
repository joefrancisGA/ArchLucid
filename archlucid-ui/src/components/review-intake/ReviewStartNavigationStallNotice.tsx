"use client";

import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_START_NAVIGATION_STALL_MESSAGE,
  REVIEW_START_OPEN_DIRECTLY_CTA,
} from "@/lib/review-start-progress-copy";
import { cn } from "@/lib/utils";

export type ReviewStartNavigationStallNoticeProps = {
  /** Same href the stalled soft navigation targeted. */
  readonly href: string;
  readonly testId?: string;
};

/**
 * Shown when a soft navigation to the review start page is still outstanding at the wait ceiling.
 * Announced as status, not an error: the draft is saved and the pending navigation is untouched.
 */
export function ReviewStartNavigationStallNotice(
  props: ReviewStartNavigationStallNoticeProps,
): React.ReactElement {
  const { href, testId } = props;

  // Full page load rather than `next/link`: the App Router transition is the thing that stalled.
  const openDirectly = useCallback(() => {
    window.location.assign(href);
  }, [href]);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={testId ?? "review-start-navigation-stall"}
      className="space-y-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{REVIEW_START_NAVIGATION_STALL_MESSAGE}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openDirectly}
        data-testid={`${testId ?? "review-start-navigation-stall"}-open-directly`}
      >
        {REVIEW_START_OPEN_DIRECTLY_CTA}
      </Button>
    </div>
  );
}
