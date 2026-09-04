"use client";

import { useSearchParams } from "next/navigation";

import { ReviewPresenterElicitationActions } from "@/components/reviews/ReviewPresenterElicitationActions";
import {
  ReviewDetailWorkspace,
  type ReviewDetailWorkspaceProps,
} from "@/components/reviews/ReviewDetailWorkspace";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useReviewPresenterElicitation } from "@/hooks/use-review-presenter-elicitation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readPresenterModeFromSearchParams } from "@/lib/review-detail-workspace-tabs";
import { cn } from "@/lib/utils";

export type RunDetailPresenterElicitationBridgeProps = ReviewDetailWorkspaceProps & {
  readonly architectureRequestId?: string | null;
};

/** Wires presenter elicitation actions into {@link ReviewDetailWorkspace} (FD-01). */
export function RunDetailPresenterElicitationBridge(
  props: RunDetailPresenterElicitationBridgeProps,
): React.JSX.Element {
  const { architectureRequestId, ...workspaceProps } = props;
  const searchParams = useSearchParams();
  const { isWorkingMode } = useWorkspaceMode();
  const presenterMode = readPresenterModeFromSearchParams(searchParams);
  const elicitation = useReviewPresenterElicitation(architectureRequestId);

  const showPresenterElicitation = presenterMode && isWorkingMode;

  const presenterFindingTitle = showPresenterElicitation ? elicitation.title : undefined;

  const presenterFindingBody = showPresenterElicitation ? (
    <div className="space-y-6" data-testid="review-presenter-elicitation-body">
      {workspaceProps.defensibilityStrip ?? null}
      {elicitation.readyToFinalize ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          No pending MUST or SHOULD questions. Return to the review to finalize when the package is ready.
          {elicitation.pendingQuestionCount === 0 ? null : (
            <>
              {" "}
              Skipped MUST items remain visible in the trail above.
            </>
          )}
        </p>
      ) : elicitation.primaryQuestion !== null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {elicitation.primaryQuestion.tier} question — mediate yes, no, or ask for another question.
        </p>
      ) : null}
    </div>
  ) : undefined;

  const presenterFindingActions = showPresenterElicitation ? (
    <ReviewPresenterElicitationActions elicitation={elicitation} />
  ) : undefined;

  return (
    <ReviewDetailWorkspace
      {...workspaceProps}
      presenterFindingTitle={presenterFindingTitle}
      presenterFindingBody={presenterFindingBody}
      presenterFindingActions={presenterFindingActions}
    />
  );
}
