"use client";

import { useCallback, useEffect, useState, type ReactElement, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ArchitectureObjectMapStrip } from "@/components/operator/ArchitectureObjectMapStrip";
import { OperatorAttentionKindStrip } from "@/components/operator/OperatorAttentionKindStrip";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import {
  parseReviewsHubMedianDeltaOpenFromSearch,
  parseReviewsHubMoreWaysOpenFromSearch,
  parseReviewsHubReviewCycleDeltaOpenFromSearch,
  reviewsHubDisclosureHrefFromSearch,
  type ReviewsHubDisclosureUrlState,
} from "@/lib/reviews/reviews-hub-disclosure-url";

import {
  REVIEWS_HUB_MEDIAN_DELTA_SUMMARY,
  REVIEWS_HUB_MEDIAN_DELTA_TITLE,
  REVIEWS_HUB_MORE_WAYS_SUMMARY,
  REVIEWS_HUB_MORE_WAYS_TITLE,
  REVIEWS_HUB_REVIEW_CYCLE_DELTA_SUMMARY,
  REVIEWS_HUB_REVIEW_CYCLE_DELTA_TITLE,
} from "./reviews-hub-copy";
import {
  ReviewsHubBeforeAfterDeltaPanelDeferred,
  ReviewsHubExploreSamplesDeferred,
  ReviewsHubPackageIncludesDeferred,
  RunsIndexBeforeAfterPanelDeferred,
} from "./reviews-hub-deferred-chunks";

const REVIEWS_HUB_GUIDANCE_STACK_CLASS = cn(
  OPERATOR_LAYOUT.sectionStack,
  "border-t border-neutral-200 pt-6 dark:border-neutral-800",
);
const REVIEWS_HUB_ANALYTICS_STACK_CLASS = cn(
  OPERATOR_LAYOUT.sectionStack,
  "border-t border-neutral-200 pt-6 dark:border-neutral-800",
  "[&_[data-testid=before-after-delta-panel]]:mb-0 [&_[data-testid=before-after-delta-panel-top]]:mb-0",
  "[&_[data-testid=before-after-delta-panel]]:max-w-none [&_[data-testid=before-after-delta-panel-top]]:max-w-none",
);

type ReviewsHubDisclosuresClientProps = {
  readonly attentionSuppressKinds: readonly string[];
  readonly firstCommittedRunId: string | null;
};

function readReviewsHubDisclosureState(searchParams: URLSearchParams): ReviewsHubDisclosureUrlState {
  return {
    moreWaysOpen: parseReviewsHubMoreWaysOpenFromSearch(searchParams.get("reviewsHubMoreWaysOpen")),
    medianDeltaOpen: parseReviewsHubMedianDeltaOpenFromSearch(searchParams.get("reviewsHubMedianDeltaOpen")),
    reviewCycleDeltaOpen: parseReviewsHubReviewCycleDeltaOpenFromSearch(
      searchParams.get("reviewsHubReviewCycleDeltaOpen"),
    ),
  };
}

/** Reviews hub guidance and analytics collapsibles synced to URL params. */
export function ReviewsHubDisclosuresClient(props: ReviewsHubDisclosuresClientProps): ReactElement {
  const { attentionSuppressKinds, firstCommittedRunId } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const reviewsHubMoreWaysOpenParam = searchParams.get("reviewsHubMoreWaysOpen");
  const reviewsHubMedianDeltaOpenParam = searchParams.get("reviewsHubMedianDeltaOpen");
  const reviewsHubReviewCycleDeltaOpenParam = searchParams.get("reviewsHubReviewCycleDeltaOpen");

  const [disclosureState, setDisclosureState] = useState<ReviewsHubDisclosureUrlState>(() =>
    readReviewsHubDisclosureState(searchParams),
  );

  const syncDisclosuresToUrl = useCallback(
    (state: ReviewsHubDisclosureUrlState) => {
      router.replace(reviewsHubDisclosureHrefFromSearch(searchParams.toString(), state, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setDisclosurePanelOpen = useCallback(
    (key: keyof ReviewsHubDisclosureUrlState, value: SetStateAction<boolean>) => {
      setDisclosureState((current) => {
        const nextValue = typeof value === "function" ? value(current[key]) : value;
        const nextState = { ...current, [key]: nextValue };
        syncDisclosuresToUrl(nextState);

        return nextState;
      });
    },
    [syncDisclosuresToUrl],
  );

  useEffect(() => {
    setDisclosureState({
      moreWaysOpen: parseReviewsHubMoreWaysOpenFromSearch(reviewsHubMoreWaysOpenParam),
      medianDeltaOpen: parseReviewsHubMedianDeltaOpenFromSearch(reviewsHubMedianDeltaOpenParam),
      reviewCycleDeltaOpen: parseReviewsHubReviewCycleDeltaOpenFromSearch(reviewsHubReviewCycleDeltaOpenParam),
    });
  }, [reviewsHubMedianDeltaOpenParam, reviewsHubMoreWaysOpenParam, reviewsHubReviewCycleDeltaOpenParam]);

  return (
    <>
      <section
        aria-label="Reviews hub guidance"
        className={REVIEWS_HUB_GUIDANCE_STACK_CLASS}
        data-testid="reviews-hub-guidance"
      >
        <OperatorAttentionKindStrip
          variant="compact"
          suppressKinds={attentionSuppressKinds.length > 0 ? attentionSuppressKinds : undefined}
        />
        <ArchitectureObjectMapStrip focus="review" />
        <CollapsibleSection
          title={REVIEWS_HUB_MORE_WAYS_TITLE}
          summaryLine={REVIEWS_HUB_MORE_WAYS_SUMMARY}
          open={disclosureState.moreWaysOpen}
          onToggle={(open) => setDisclosurePanelOpen("moreWaysOpen", open)}
          sectionTestId="reviews-hub-more-ways"
          className="mb-0 p-4"
        >
          <ReviewsHubExploreSamplesDeferred />
          <ReviewsHubPackageIncludesDeferred />
        </CollapsibleSection>
      </section>

      <div className={REVIEWS_HUB_ANALYTICS_STACK_CLASS} data-testid="reviews-hub-analytics">
        <CollapsibleSection
          title={REVIEWS_HUB_MEDIAN_DELTA_TITLE}
          summaryLine={REVIEWS_HUB_MEDIAN_DELTA_SUMMARY}
          open={disclosureState.medianDeltaOpen}
          onToggle={(open) => setDisclosurePanelOpen("medianDeltaOpen", open)}
          sectionTestId="reviews-hub-median-delta"
          className="mb-0"
        >
          <ReviewsHubBeforeAfterDeltaPanelDeferred embeddedInCollapsible />
        </CollapsibleSection>
        {firstCommittedRunId !== null ? (
          <CollapsibleSection
            title={REVIEWS_HUB_REVIEW_CYCLE_DELTA_TITLE}
            summaryLine={REVIEWS_HUB_REVIEW_CYCLE_DELTA_SUMMARY}
            open={disclosureState.reviewCycleDeltaOpen}
            onToggle={(open) => setDisclosurePanelOpen("reviewCycleDeltaOpen", open)}
            sectionTestId="reviews-hub-review-cycle-delta"
            className="mb-0"
          >
            <RunsIndexBeforeAfterPanelDeferred committedRunId={firstCommittedRunId} embeddedInCollapsible />
          </CollapsibleSection>
        ) : null}
      </div>
    </>
  );
}
