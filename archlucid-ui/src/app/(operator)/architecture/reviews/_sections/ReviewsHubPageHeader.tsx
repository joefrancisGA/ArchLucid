"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RunsListProofHeadline } from "@/components/runs/RunsListProofHeadline";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { resolveSystemNotJobReviewsHubClaimDiscipline } from "@/lib/system-not-job-reviews-hub-inbox-copy";

import { ReviewsHubHeaderActions } from "./ReviewsHubHeaderActions";
import { ReviewsHubWorkingInboxCaption } from "./ReviewsHubWorkingInboxCaption";
import { resolveReviewsHubPageCopy } from "./reviews-hub-page-copy-resolver";

type ReviewsHubPageHeaderProps = {
  readonly projectId: string;
  readonly projectTitle: string;
};

/** Working-aware page header for `/architecture/reviews` (AO-26). */
export function ReviewsHubPageHeader(props: ReviewsHubPageHeaderProps): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();
  const pageCopy = resolveReviewsHubPageCopy(isWorkingMode);

  return (
    <OperatorPageHeader
      navHref={REVIEWS_LIST_PATH}
      title={pageCopy.title}
      subtitle={pageCopy.subtitle}
      claimDiscipline={resolveSystemNotJobReviewsHubClaimDiscipline(isWorkingMode)}
      claimDisciplineTestId="reviews-hub-claim-discipline"
      headingLevel="h1"
      titleTestId="reviews-hub-page-title"
      subtitleTestId="reviews-hub-page-subtitle"
      metadata={
        <>
          <ReviewsHubWorkingInboxCaption />
          {props.projectId !== "default" ? (
            <span
              className={cn(OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
              data-testid="runs-page-project-label"
            >
              <InlineGuidanceText text={props.projectTitle} />
            </span>
          ) : null}
          {isOperatorExperienceFullShellEnv() ? <RunsListProofHeadline /> : null}
        </>
      }
      actions={<ReviewsHubHeaderActions />}
    />
  );
}
