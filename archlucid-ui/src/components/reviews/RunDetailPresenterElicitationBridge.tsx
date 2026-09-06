"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { ReviewPresenterElicitationActions } from "@/components/reviews/ReviewPresenterElicitationActions";
import {
  ReviewDetailWorkspace,
  type ReviewDetailWorkspaceProps,
} from "@/components/reviews/ReviewDetailWorkspace";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useReviewPresenterElicitation } from "@/hooks/use-review-presenter-elicitation";
import { listPresenterAssertedAnswerEntries } from "@/lib/reviews/review-presenter-asserted-trail";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_PRESENTER_ASSERTED_CAPTURE_HEADING,
  REVIEW_PRESENTER_RECORDED_ASSERTED_LABEL,
  reviewPresenterAssertedCaptureLine,
} from "@/lib/reviews/review-presenter-elicitation-copy";
import { readPresenterModeFromSearchParams } from "@/lib/review-detail-workspace-tabs";
import {
  parseReviewPresenterQuestionIdFromSearch,
  reviewPresenterElicitationHrefFromSearch,
} from "@/lib/reviews/review-presenter-elicitation-url";
import { cn } from "@/lib/utils";

export type RunDetailPresenterElicitationBridgeProps = ReviewDetailWorkspaceProps & {
  readonly architectureRequestId?: string | null;
};

/** Wires presenter elicitation actions into {@link ReviewDetailWorkspace} (FD-01). */
export function RunDetailPresenterElicitationBridge(
  props: RunDetailPresenterElicitationBridgeProps,
): React.JSX.Element {
  const { architectureRequestId, ...workspaceProps } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const presenterQuestionIdParam = searchParams.get("presenterQuestionId");
  const { isWorkingMode } = useWorkspaceMode();
  const presenterMode = readPresenterModeFromSearchParams(searchParams);
  const elicitation = useReviewPresenterElicitation(architectureRequestId, workspaceProps.runId);

  const showPresenterElicitation = presenterMode && isWorkingMode;
  const primaryQuestionKey = elicitation.primaryQuestion?.questionKey ?? "";

  useEffect(() => {
    if (!showPresenterElicitation) {
      return;
    }

    const urlQuestionId = parseReviewPresenterQuestionIdFromSearch(presenterQuestionIdParam);
    const nextQuestionId = primaryQuestionKey.trim().length > 0 ? primaryQuestionKey : null;

    if (urlQuestionId === (nextQuestionId ?? "")) {
      return;
    }

    router.replace(
      reviewPresenterElicitationHrefFromSearch(searchParams.toString(), nextQuestionId, pathname),
      { scroll: false },
    );
  }, [
    pathname,
    presenterQuestionIdParam,
    primaryQuestionKey,
    router,
    searchParams,
    showPresenterElicitation,
  ]);

  const presenterFindingTitle = showPresenterElicitation ? elicitation.title : undefined;

  const presenterFindingBody = showPresenterElicitation ? (
    <div className="space-y-6" data-testid="review-presenter-elicitation-body">
      {workspaceProps.defensibilityStrip ?? null}
      {elicitation.lastRecordedEntry !== null ? (
        <p
          className={cn("m-0 font-medium text-emerald-800 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.body)}
          data-testid="review-presenter-recorded-asserted"
        >
          {REVIEW_PRESENTER_RECORDED_ASSERTED_LABEL}
          {" "}
          {reviewPresenterAssertedCaptureLine(
            elicitation.lastRecordedEntry.questionKey,
            elicitation.lastRecordedEntry.answer,
            elicitation.lastRecordedEntry.responderLabel,
          )}
        </p>
      ) : null}
      {listPresenterAssertedAnswerEntries(elicitation.transparencyTrail).length > 0 ? (
        <div className="space-y-2" data-testid="review-presenter-asserted-trail">
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {REVIEW_PRESENTER_ASSERTED_CAPTURE_HEADING}
          </h3>
          <ul className="m-0 list-disc space-y-1 pl-5">
            {listPresenterAssertedAnswerEntries(elicitation.transparencyTrail).map((entry) => (
              <li key={entry.key} className={OPERATOR_TYPOGRAPHY.helper}>
                {entry.value}
                {entry.responderLabel ? ` — ${entry.responderLabel}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
