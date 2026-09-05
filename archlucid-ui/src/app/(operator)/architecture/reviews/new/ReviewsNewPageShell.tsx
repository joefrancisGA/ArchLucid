"use client";

import { useSearchParams } from "next/navigation";

import { PathChooserCreateObjectVocabularyRail } from "@/components/PathChooserCreateObjectVocabularyRail";
import { ReviewsNewStarterTemplateGallery } from "@/components/review-intake/ReviewsNewStarterTemplateGallery";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { ReviewsNewWizardResumeStrip } from "@/components/usability/ReviewsNewWizardResumeStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import {
  resolveReviewsNewPathModeFromQuery,
  reviewsNewShowsPathTabChrome,
} from "@/lib/reviews-new-page-resume-hero";
import { cn } from "@/lib/utils";

import { ReviewsNewBuyerChrome } from "./ReviewsNewBuyerChrome";
import { ReviewsNewPageChrome } from "./ReviewsNewPageChrome";
import {
  REVIEWS_NEW_FIRST_VIEWPORT_ID,
  REVIEWS_NEW_PRIMARY_CONTENT_ID,
  REVIEWS_NEW_SKIP_LINK_LABEL,
  REVIEWS_NEW_SKIP_TARGET_ID,
} from "./reviews-new-page-surface-copy";

type ReviewsNewPageShellProps = {
  readonly children: React.ReactNode;
};

function reviewsNewBuyerChromeRendersInShell(pathQuery: string): boolean {
  return pathQuery !== "guided-intake";
}

/** Shared `/architecture/reviews/new` layout — skip link, header, and intake workspace (RNX / REN / REQ / ENE). */
export function ReviewsNewPageShell(props: ReviewsNewPageShellProps): React.JSX.Element {
  const evalChrome = useProductionEvalChrome();
  const searchParams = useSearchParams();
  const pathQuery = searchParams?.get("path")?.trim() ?? "";
  const activePath = resolveReviewsNewPathModeFromQuery(pathQuery);
  const onPathTab = reviewsNewShowsPathTabChrome(evalChrome, activePath);
  const showBuyerChromeInShell = evalChrome && reviewsNewBuyerChromeRendersInShell(pathQuery);

  return (
    <OperatorPageContainer variant="workflow" withContextRail={evalChrome}>
      <a
        href={`#${REVIEWS_NEW_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {REVIEWS_NEW_SKIP_LINK_LABEL}
      </a>

      <div
        id={REVIEWS_NEW_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
        data-testid="reviews-new-primary-content"
      >
        <ReviewsNewPageChrome buyerPolishedShell={evalChrome} activePath={activePath} />

        <div
          id={REVIEWS_NEW_FIRST_VIEWPORT_ID}
          data-testid={REVIEWS_NEW_FIRST_VIEWPORT_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          {!onPathTab ? <ReviewsNewWizardResumeStrip /> : null}
          {props.children}
          {!onPathTab ? <ReviewsNewStarterTemplateGallery /> : null}
        </div>

        {evalChrome || onPathTab ? null : (
          <PathChooserCreateObjectVocabularyRail currentSurfaceId="reviews-new" />
        )}

        {showBuyerChromeInShell ? <ReviewsNewBuyerChrome /> : null}
      </div>
    </OperatorPageContainer>
  );
}
