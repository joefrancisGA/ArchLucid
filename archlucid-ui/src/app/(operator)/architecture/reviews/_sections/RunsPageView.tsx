import { cn } from "@/lib/utils";

import { ArchitectureObjectMapStrip } from "@/components/operator/ArchitectureObjectMapStrip";
import { OperatorAttentionKindStrip } from "@/components/operator/OperatorAttentionKindStrip";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorDemoStaticBanner } from "@/components/operator/OperatorDemoStaticBanner";
import { OperatorMalformedCallout, OperatorTryNext } from "@/components/operator/OperatorShellMessage";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RunsListProofHeadline } from "@/components/runs/RunsListProofHeadline";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import {
  BUYER_RUNS_LIST_MALFORMED_BODY,
  BUYER_RUNS_LIST_MALFORMED_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { isApiNotFoundFailure } from "@/lib/api-load-failure";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { REVIEWS_HUB_CLAIM_DISCIPLINE } from "@/lib/reviews-hub-evidence-copy";
import {
  REVIEWS_HUB_FIRST_VIEWPORT_ID,
  REVIEWS_HUB_PRIMARY_CONTENT_ID,
  REVIEWS_HUB_SKIP_LINK_LABEL,
  REVIEWS_HUB_SKIP_TARGET_ID,
} from "@/lib/reviews-hub-page-copy";

import {
  REVIEWS_HUB_ADVANCED_LIST_DISCLOSURE,
  REVIEWS_HUB_LIST_LOAD_FAILURE_TRY_NEXT,
  REVIEWS_HUB_LIST_NOT_FOUND_TRY_NEXT,
  REVIEWS_HUB_MEDIAN_DELTA_SUMMARY,
  REVIEWS_HUB_MEDIAN_DELTA_TITLE,
  REVIEWS_HUB_MORE_WAYS_SUMMARY,
  REVIEWS_HUB_MORE_WAYS_TITLE,
  REVIEWS_HUB_PAGE_SUBTITLE,
  REVIEWS_HUB_PAGE_TITLE,
  REVIEWS_HUB_REVIEW_CYCLE_DELTA_SUMMARY,
  REVIEWS_HUB_REVIEW_CYCLE_DELTA_TITLE,
} from "./reviews-hub-copy";
import { ReviewsHubHeaderActions } from "./ReviewsHubHeaderActions";
import { ReviewsHubBuyerChrome } from "./ReviewsHubBuyerChrome";
import {
  OperatorWelcomeOnboardingDeferred,
  ReviewsHubBeforeAfterDeltaPanelDeferred,
  ReviewsHubExploreSamplesDeferred,
  ReviewsHubPackageIncludesDeferred,
  ReviewsHubReviewInventoryDeferred,
  RunsIndexBeforeAfterPanelDeferred,
  RunsListAggregateErrorBoundaryDeferred,
} from "./reviews-hub-deferred-chunks";
import { ReviewsHubResumeDrafts } from "./ReviewsHubResumeDrafts";
import { ReviewsHubContinueReviewStrip } from "./ReviewsHubContinueReviewStrip";
import { resolveReviewsHubContinueReviewCandidate } from "@/lib/reviews-hub-continue-review";
import { resolveReviewsHubAttentionSuppressKinds } from "@/lib/reviews-hub-attention-suppress";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import type { RunsPageModel } from "./runs-page-model";
import { deriveReviewsWorkspaceSummary } from "./reviews-workspace-summary";

type Props = {
  readonly model: RunsPageModel;
};

const REVIEWS_HUB_BODY_STACK_CLASS = OPERATOR_LAYOUT.majorSectionGap;
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

/** Server component: reviews index body (list fetch happens in `loadRunsPageModel`). */
export function RunsPageView(props: Props) {
  const m = props.model;
  const loadFailure = m.loadFailure;
  const malformedMessage = m.malformedMessage;
  const isDev = process.env.NODE_ENV === "development";
  const workspaceSummary = deriveReviewsWorkspaceSummary(m.runs);
  const continueReviewCandidate = resolveReviewsHubContinueReviewCandidate(m.runs);
  const attentionSuppressKinds = resolveReviewsHubAttentionSuppressKinds({
    hasContinueStrip: continueReviewCandidate !== null,
    hasInProgressInventory: workspaceSummary.inProgress > 0,
    readyForGovernanceCount: workspaceSummary.readyForGovernance,
  });
  const hubLoadOk = loadFailure === null && malformedMessage === null;
  const hasReviews = m.runs.length > 0;
  // Advanced aggregate list only when the hub page cannot show the full inventory.
  const showAdvancedList =
    isOperatorExperienceFullShellEnv() && hubLoadOk && hasReviews && m.totalCount > m.pageSize;

  return (
    <OperatorPageContainer variant="full">
      <a
        href={`#${REVIEWS_HUB_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {REVIEWS_HUB_SKIP_LINK_LABEL}
      </a>

      <OperatorWelcomeOnboardingDeferred serverEligible={m.welcomeOnboardingEligible} />
      <OperatorPageHeader
        navHref={REVIEWS_LIST_PATH}
        title={REVIEWS_HUB_PAGE_TITLE}
        subtitle={REVIEWS_HUB_PAGE_SUBTITLE}
        claimDiscipline={REVIEWS_HUB_CLAIM_DISCIPLINE}
        claimDisciplineTestId="reviews-hub-claim-discipline"
        headingLevel="h1"
        titleTestId="reviews-hub-page-title"
        subtitleTestId="reviews-hub-page-subtitle"
        metadata={
          <>
            {m.projectId !== "default" ? (
              <span
                className={cn(OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
                data-testid="runs-page-project-label"
              >
                <InlineGuidanceText text={m.projectTitle} />
              </span>
            ) : null}
            {isOperatorExperienceFullShellEnv() ? <RunsListProofHeadline /> : null}
          </>
        }
        actions={<ReviewsHubHeaderActions />}
      />
      <div
        id={REVIEWS_HUB_PRIMARY_CONTENT_ID}
        data-testid={REVIEWS_HUB_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", REVIEWS_HUB_BODY_STACK_CLASS)}
      >
        <div
          id={REVIEWS_HUB_FIRST_VIEWPORT_ID}
          data-testid={REVIEWS_HUB_FIRST_VIEWPORT_ID}
          className={cn("scroll-mt-24", REVIEWS_HUB_BODY_STACK_CLASS)}
        >
        {hubLoadOk ? (
          <>
            <ReviewsHubReviewInventoryDeferred
              runs={m.runs}
              summary={workspaceSummary}
              totalCount={m.totalCount}
              pageSize={m.pageSize}
              hasMore={m.totalCount > m.runs.length || m.nextCursorForClient !== null}
            />
            {continueReviewCandidate !== null ? (
              <ReviewsHubContinueReviewStrip candidate={continueReviewCandidate} />
            ) : null}
            <ReviewsHubResumeDrafts />
          </>
        ) : null}

        {m.usedStaticRunsFallback && isOperatorExperienceFullShellEnv() ? (
          <div className="max-w-5xl">
            <OperatorDemoStaticBanner />
          </div>
        ) : null}

        {loadFailure ? (
          <>
            <OperatorApiProblem failure={loadFailure} />
            <OperatorTryNext>
              {isApiNotFoundFailure(loadFailure)
                ? REVIEWS_HUB_LIST_NOT_FOUND_TRY_NEXT
                : REVIEWS_HUB_LIST_LOAD_FAILURE_TRY_NEXT}
            </OperatorTryNext>
          </>
        ) : null}

        {!loadFailure && malformedMessage ? (
          <>
            <OperatorMalformedCallout>
              <strong>{BUYER_RUNS_LIST_MALFORMED_HEADING}</strong>
              <p className="mt-2">{isDev ? malformedMessage : BUYER_RUNS_LIST_MALFORMED_BODY}</p>
              {isDev ? (
                <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
                  The HTTP call may have succeeded, but the JSON did not match the expected paged review summary shape. This is distinct from
                  an empty project (zero reviews).
                </p>
              ) : null}
            </OperatorMalformedCallout>
            <FatalPageReportProblemSupportRow
              surfaceId="reviews-hub-unexpected-response"
              errorTitle={BUYER_RUNS_LIST_MALFORMED_HEADING}
              errorCode="malformed-response"
            />
            {isDev ? (
              <OperatorTryNext>The server response was unexpected. If this persists, contact support.</OperatorTryNext>
            ) : null}
          </>
        ) : null}

        {showAdvancedList ? (
          <section data-testid="reviews-hub-paginated-inventory">
            <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {REVIEWS_HUB_ADVANCED_LIST_DISCLOSURE}
            </h2>
            <div className="mt-4">
              <RunsListAggregateErrorBoundaryDeferred
                runs={m.runs}
                projectId={m.projectId}
                page={m.page}
                pageSize={m.pageSize}
                totalCount={m.totalCount}
                nextCursor={m.nextCursorForClient}
                continueStripRunId={continueReviewCandidate?.runId ?? null}
              />
            </div>
          </section>
        ) : null}
        </div>

        {hubLoadOk && hasReviews ? (
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
              defaultOpen={false}
              sectionTestId="reviews-hub-more-ways"
              className="mb-0 p-4"
            >
              <ReviewsHubExploreSamplesDeferred />
              <ReviewsHubPackageIncludesDeferred />
            </CollapsibleSection>
          </section>
        ) : null}

        {hubLoadOk && hasReviews ? (
          <div className={REVIEWS_HUB_ANALYTICS_STACK_CLASS} data-testid="reviews-hub-analytics">
            <CollapsibleSection
              title={REVIEWS_HUB_MEDIAN_DELTA_TITLE}
              summaryLine={REVIEWS_HUB_MEDIAN_DELTA_SUMMARY}
              defaultOpen={false}
              sectionTestId="reviews-hub-median-delta"
              className="mb-0"
            >
              <ReviewsHubBeforeAfterDeltaPanelDeferred embeddedInCollapsible />
            </CollapsibleSection>
            {m.firstCommittedRunId !== null ? (
              <CollapsibleSection
                title={REVIEWS_HUB_REVIEW_CYCLE_DELTA_TITLE}
                summaryLine={REVIEWS_HUB_REVIEW_CYCLE_DELTA_SUMMARY}
                defaultOpen={false}
                sectionTestId="reviews-hub-review-cycle-delta"
                className="mb-0"
              >
                <RunsIndexBeforeAfterPanelDeferred
                  committedRunId={m.firstCommittedRunId}
                  embeddedInCollapsible
                />
              </CollapsibleSection>
            ) : null}
          </div>
        ) : null}

        <ReviewsHubBuyerChrome />
      </div>
    </OperatorPageContainer>
  );
}
