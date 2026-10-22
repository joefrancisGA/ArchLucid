"use client";

import type { ReactElement } from "react";

import { ReviewRoomElicitationPanel } from "@/components/reviews/ReviewRoomElicitationPanel";
import { useReviewPresenterElicitation } from "@/hooks/use-review-presenter-elicitation";
import { resolveInhabitRoomCardHeaderPresentation } from "@/lib/inhabit/inhabit-room-card-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type InhabitedFindingsRoomCardProps = {
  readonly architectureDisplayName: string;
  readonly architectureRequestId?: string | null;
  readonly scopedRunId?: string | null;
  readonly scopedRunTitle?: string | null;
};

/** IH-053 / IH-054 — non-modal room card on Working nested findings when a MUST is unanswered. */
export function InhabitedFindingsRoomCard(props: InhabitedFindingsRoomCardProps): ReactElement | null {
  const draftId = props.architectureRequestId?.trim() ?? "";
  const runId = props.scopedRunId?.trim() ?? "";
  const elicitation = useReviewPresenterElicitation(
    draftId.length > 0 ? draftId : null,
    runId.length > 0 ? runId : null,
  );
  const header = resolveInhabitRoomCardHeaderPresentation({
    architectureDisplayName: props.architectureDisplayName,
    scopedRunId: props.scopedRunId,
    scopedRunTitle: props.scopedRunTitle,
  });

  if (elicitation.primaryQuestion === null && elicitation.readyToFinalize) {
    return null;
  }

  if (elicitation.primaryQuestion === null && elicitation.questionsBlockedReason !== null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="inhabited-findings-room-card">
      <header className="space-y-1">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{header.architectureTitle}</h2>
        {header.jobSubtitle !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Open job: {header.jobSubtitle}
          </p>
        ) : null}
      </header>
      <ReviewRoomElicitationPanel elicitation={elicitation} />
    </div>
  );
}
