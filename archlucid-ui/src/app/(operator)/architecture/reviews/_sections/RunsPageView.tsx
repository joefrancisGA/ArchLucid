import { cn } from "@/lib/utils";

import { ReviewsHubBeforeAfterDeltaPanel } from "./ReviewsHubBeforeAfterDeltaPanel";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { OperatorMalformedCallout, OperatorTryNext } from "@/components/OperatorShellMessage";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { OperatorWelcomeOnboarding } from "@/components/OperatorWelcomeOnboarding";
import { RunsIndexBeforeAfterPanel } from "@/components/RunsIndexBeforeAfterPanel";
import { RunsListAggregateErrorBoundary } from "@/components/RunsListAggregateErrorBoundary";
import { RunsListProofHeadline } from "@/components/RunsListProofHeadline";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import {
  BUYER_RUNS_LIST_MALFORMED_BODY,
  BUYER_RUNS_LIST_MALFORMED_HEADING,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";

import {
  REVIEWS_HUB_ADVANCED_LIST_DISCLOSURE,
  REVIEWS_HUB_MORE_WAYS_SUMMARY,
  REVIEWS_HUB_MORE_WAYS_TITLE,
  REVIEWS_HUB_PAGE_SUBTITLE,
  REVIEWS_HUB_PAGE_TITLE,
} from "./reviews-hub-copy";
import { ReviewsHubExploreSamples } from "./ReviewsHubExploreSamples";
import { ReviewsHubHeaderActions } from "./ReviewsHubHeaderActions";
import { ReviewsHubPackageIncludes } from "./ReviewsHubPackageIncludes";
import { ReviewsHubResumeDrafts } from "./ReviewsHubResumeDrafts";
import { ReviewsHubReviewInventory } from "./ReviewsHubReviewInventory";
import { ReviewsHubSummaryRow } from "./ReviewsHubSummaryRow";
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
      <OperatorWelcomeOnboarding serverEligible={m.welcomeOnboardingEligible} />
      <OperatorPageHeader
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
        helpKey="runs-list-overview"
        docsPageKey={REVIEWS_LIST_PATH}
        actions={<ReviewsHubHeaderActions />}
      />
{hubLoadOk ? (
        <>
          <ReviewsHubSummaryRow summary={workspaceSummary} />
          <ReviewsHubReviewInventory runs={m.runs} />
          <ReviewsHubResumeDrafts />
          {hasReviews ? (
            <CollapsibleSection
              title={REVIEWS_HUB_MORE_WAYS_TITLE}
              summaryLine={REVIEWS_HUB_MORE_WAYS_SUMMARY}
              defaultOpen={false}
              sectionTestId="reviews-hub-more-ways"
            >
              <ReviewsHubExploreSamples />
              <ReviewsHubPackageIncludes />
            </CollapsibleSection>
          ) : null}
        </>
      ) : null}

      {m.usedStaticRunsFallback && isOperatorExperienceFullShellEnv() ? (
        <div className="mt-4 max-w-5xl">
          <OperatorDemoStaticBanner />
        </div>
      ) : null}

      {hubLoadOk && hasReviews ? <ReviewsHubBeforeAfterDeltaPanel /> : null}

      {hubLoadOk && hasReviews && m.firstCommittedRunId !== null ? (
        <RunsIndexBeforeAfterPanel committedRunId={m.firstCommittedRunId} />
      ) : null}

      {loadFailure ? (
        <>
          <OperatorApiProblem
            problem={loadFailure.problem}
            fallbackMessage={loadFailure.message}
            correlationId={loadFailure.correlationId}
          />
          <OperatorTryNext>The reviews list could not be loaded. Check your connection and try reloading.</OperatorTryNext>
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
            <RunsListAggregateErrorBoundary
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
