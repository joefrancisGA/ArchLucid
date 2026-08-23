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
import { OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";

import {
  REVIEWS_HUB_ADVANCED_LIST_DISCLOSURE,
  REVIEWS_HUB_LIST_LOAD_FAILURE_TRY_NEXT,
  REVIEWS_HUB_LIST_NOT_FOUND_TRY_NEXT,
  REVIEWS_HUB_MORE_WAYS_SUMMARY,
  REVIEWS_HUB_MORE_WAYS_TITLE,
  REVIEWS_HUB_PAGE_SUBTITLE,
  REVIEWS_HUB_PAGE_TITLE,
} from "./reviews-hub-copy";
import { ReviewsHubHeaderActions } from "./ReviewsHubHeaderActions";
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
import { ReviewsHubSummaryRow } from "./ReviewsHubSummaryRow";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import type { RunsPageModel } from "./runs-page-model";
import { deriveReviewsWorkspaceSummary } from "./reviews-workspace-summary";

type Props = {
  readonly model: RunsPageModel;
};

/** Server component: reviews index body (list fetch happens in `loadRunsPageModel`). */
export function RunsPageView(props: Props) {
  const m = props.model;
  const loadFailure = m.loadFailure;
  const malformedMessage = m.malformedMessage;
  const isDev = process.env.NODE_ENV === "development";
  const workspaceSummary = deriveReviewsWorkspaceSummary(m.runs);
  const hubLoadOk = loadFailure === null && malformedMessage === null;
  const hasReviews = m.runs.length > 0;
  // Advanced aggregate list only when the hub page cannot show the full inventory.
  const showAdvancedList =
    isOperatorExperienceFullShellEnv() && hubLoadOk && hasReviews && m.totalCount > m.pageSize;

  return (
    <OperatorPageContainer variant="dashboard">
      <OperatorWelcomeOnboardingDeferred serverEligible={m.welcomeOnboardingEligible} />
      <OperatorPageHeader
        navHref={REVIEWS_LIST_PATH}
        title={REVIEWS_HUB_PAGE_TITLE}
        subtitle={REVIEWS_HUB_PAGE_SUBTITLE}
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
      <ArchitectureObjectMapStrip focus="review" />
      {hasReviews ? <OperatorAttentionKindStrip variant="compact" /> : null}
      {hubLoadOk ? (
        <>
          <ReviewsHubSummaryRow summary={workspaceSummary} />
          <ReviewsHubReviewInventoryDeferred runs={m.runs} />
          <ReviewsHubResumeDrafts />
          {hasReviews ? (
            <CollapsibleSection
              title={REVIEWS_HUB_MORE_WAYS_TITLE}
              summaryLine={REVIEWS_HUB_MORE_WAYS_SUMMARY}
              defaultOpen={false}
              sectionTestId="reviews-hub-more-ways"
              className="mt-4"
            >
              <ReviewsHubExploreSamplesDeferred />
              <ReviewsHubPackageIncludesDeferred />
            </CollapsibleSection>
          ) : null}
        </>
      ) : null}

      {m.usedStaticRunsFallback && isOperatorExperienceFullShellEnv() ? (
        <div className="mt-4 max-w-5xl">
          <OperatorDemoStaticBanner />
        </div>
      ) : null}

      {hubLoadOk && hasReviews ? <ReviewsHubBeforeAfterDeltaPanelDeferred /> : null}

      {hubLoadOk && hasReviews && m.firstCommittedRunId !== null ? (
        <RunsIndexBeforeAfterPanelDeferred committedRunId={m.firstCommittedRunId} />
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
        <details className="mt-8 rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800">
          <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {REVIEWS_HUB_ADVANCED_LIST_DISCLOSURE}
          </summary>
          <div className="mt-4">
            <RunsListAggregateErrorBoundaryDeferred
              runs={m.runs}
              projectId={m.projectId}
              page={m.page}
              pageSize={m.pageSize}
              totalCount={m.totalCount}
              nextCursor={m.nextCursorForClient}
            />
          </div>
        </details>
      ) : null}
    </OperatorPageContainer>
  );
}
