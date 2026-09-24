"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ReviewArchiveControl } from "@/components/reviews/ReviewArchiveControl";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { PinReviewToDeskButton } from "@/components/reviews/PinReviewToDeskButton";
import { Button } from "@/components/ui/button";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { useWorkOwnershipDeletePolicyQuery } from "@/hooks/use-work-ownership-delete-policy-query";
import { canArchiveReview } from "@/lib/review-archive-eligibility";
import {
  REVIEWS_HUB_ROW_OVERFLOW_RUN_ID_PARAM,
  parseReviewsHubRowOverflowRunIdFromSearch,
  reviewsHubRowOverflowDisclosureHrefFromSearch,
} from "@/lib/reviews/reviews-hub-row-overflow-disclosure-url";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunSummary } from "@/types/authority";

import type { ReviewsHubReviewRowDisplay } from "./reviews-hub-package-display";

type ReviewsHubInventoryRowActionsProps = {
  readonly run: RunSummary;
  readonly row: ReviewsHubReviewRowDisplay;
};

/** Primary open/continue action with archive tucked into an overflow menu. */
export function ReviewsHubInventoryRowActions(
  props: ReviewsHubInventoryRowActionsProps,
): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const [openOverflowRunId, setOpenOverflowRunIdState] = useState(() =>
    parseReviewsHubRowOverflowRunIdFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get(REVIEWS_HUB_ROW_OVERFLOW_RUN_ID_PARAM),
    ),
  );
  const openOverflowRunIdRef = useRef(openOverflowRunId);
  openOverflowRunIdRef.current = openOverflowRunId;
  const syncOpenOverflowRunIdToUrl = useCallback(
    (runId: string | null) => {
      commitHrefIfChanged(
        reviewsHubRowOverflowDisclosureHrefFromSearch(readWindowLocationSearch(), runId, pathname),
        { notify: false },
      );
    },
    [pathname],
  );
  const setOpenOverflowRunId = useCallback(
    (runId: string | null) => {
      const next = runId ?? "";

      if (openOverflowRunIdRef.current === next) {
        return;
      }

      openOverflowRunIdRef.current = next;
      setOpenOverflowRunIdState(next);
      syncOpenOverflowRunIdToUrl(runId);
    },
    [syncOpenOverflowRunIdToUrl],
  );
  useEffect(() => {
    const syncOpenOverflowRunIdFromUrl = (): void => {
      const next = parseReviewsHubRowOverflowRunIdFromSearch(
        new URLSearchParams(window.location.search).get(REVIEWS_HUB_ROW_OVERFLOW_RUN_ID_PARAM),
      );

      if (openOverflowRunIdRef.current === next) {
        return;
      }

      openOverflowRunIdRef.current = next;
      setOpenOverflowRunIdState(next);
    };

    syncOpenOverflowRunIdFromUrl();
    window.addEventListener("popstate", syncOpenOverflowRunIdFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenOverflowRunIdFromUrl);
    };
  }, []);
  const { callerAuthorityRank, currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();
  const policyQuery = useWorkOwnershipDeletePolicyQuery();
  const canExecute = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const archiveEligible =
    canArchiveReview(props.run, {
      callerAuthorityRank,
      allowCreatorDeleteOwnedWork: policyQuery.data?.allowCreatorDeleteOwnedWork ?? true,
      callerPrincipal: currentPrincipal,
    }) && canExecute;
  const overflowLabel = useMemo(
    () => `More actions for ${props.row.reviewTitlePrimary}`,
    [props.row.reviewTitlePrimary],
  );
  const overflowOpen = openOverflowRunId === props.row.runId;

  return (
    <div className="flex items-center justify-end gap-2">
      <PinReviewToDeskButton
        pinRunId={props.run.runId}
        architectureId={props.row.architectureId}
        label="Pin this review"
        testId={`reviews-hub-pin-${props.row.runId}`}
      />
      <Button variant="outline" size="sm" asChild>
        <Link
          href={props.row.reviewHref}
          data-testid={`reviews-hub-open-${props.row.runId}`}
          aria-label={`${props.row.primaryAction.label}: ${props.row.reviewTitlePrimary}`}
        >
          {props.row.primaryAction.label}
        </Link>
      </Button>
      {archiveEligible ? (
        <details
          className="relative"
          open={overflowOpen}
          onToggle={(event) => {
            event.preventDefault();
            const nextOpen = !overflowOpen;
            setOpenOverflowRunId(nextOpen ? props.row.runId : null);
          }}
        >
          <summary
            className={cn(
              "flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md border border-neutral-200 text-al-text-secondary hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900",
            )}
            aria-label={overflowLabel}
            data-testid={`reviews-hub-row-overflow-${props.row.runId}`}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </summary>
          <div className="absolute right-0 z-10 mt-1 min-w-[10rem] rounded-md border border-neutral-200 bg-al-surface-raised p-1 shadow-md dark:border-neutral-700">
            <ReviewArchiveControl
              run={props.run}
              reviewTitle={props.row.reviewTitlePrimary}
              archivedRunSnapshot={props.run}
              presentation="menu-item"
            />
          </div>
        </details>
      ) : null}
    </div>
  );
}
