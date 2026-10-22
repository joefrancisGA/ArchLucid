"use client";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  findingsQueueScopeDisclosureHrefFromSearch,
  parseFindingsQueueScopeOpenFromSearch,
} from "@/lib/governance/findings-queue-scope-disclosure-url";

export type FindingsQueuePickReviewBeforeTriageStripProps = {
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
};

/** Optional review picker to scope the workspace findings queue to one review. */
export function FindingsQueuePickReviewBeforeTriageStrip(
  props: FindingsQueuePickReviewBeforeTriageStripProps,
): React.JSX.Element {
  return (
    <div className="mt-3 min-w-[16rem] max-w-xl">
      <AskRunIdPicker
        value={props.selectedReviewId}
        onChange={(value) => {
          if (value.trim().length > 0) {
            props.onSelectReview(value.trim());
          }
        }}
        selectedThreadId=""
        committedOnly
        preferAutoPick={false}
        autoSelectSyntheticSample={false}
        label="Review"
        fieldId="findings-queue-pick-review-before-triage"
        hideFieldHelper
      />
    </div>
  );
}

export type FindingsQueueScopeDisclosureProps = FindingsQueuePickReviewBeforeTriageStripProps;

/** Collapsed optional scope control — workspace-wide is the default. */
export function FindingsQueueScopeDisclosure(
  props: FindingsQueueScopeDisclosureProps,
): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/governance/findings";
  const searchParams = useSearchParams();
  const findingsQueueScopeOpenParam = searchParams.get("findingsQueueScopeOpen");
  const [open, setOpenState] = useState(() =>
    parseFindingsQueueScopeOpenFromSearch(findingsQueueScopeOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        findingsQueueScopeDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseFindingsQueueScopeOpenFromSearch(findingsQueueScopeOpenParam));
  }, [findingsQueueScopeOpenParam]);

  return (
    <details
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="findings-queue-scope-disclosure"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary
        className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Filter to one review
      </summary>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Optional — narrow the findings queue to a single review when you need review-specific triage.
      </p>
      <FindingsQueuePickReviewBeforeTriageStrip {...props} />
    </details>
  );
}
