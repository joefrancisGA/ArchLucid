"use client";

import type { ReactElement } from "react";

import {
  EnterpriseCompactEmptyState,
  type EnterpriseCompactEmptyStateAction,
} from "@/components/EnterpriseCompactEmptyState";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

export type RunDetailPreFinalizedEmptyStateProps = {
  readonly runId: string;
  readonly terminalFailure?: boolean;
  /** When true, copy may reference numbered recovery steps in Do this next. */
  readonly recoveryStepsAvailable?: boolean;
};

export function RunDetailPreFinalizedEmptyState(props: RunDetailPreFinalizedEmptyStateProps): ReactElement {
  const corePilot = useCorePilotDerivedStepStatus();
  const showFirstReviewGuide = !corePilot.isPending && corePilot.nextStepIndex !== null;
  const terminalFailure = props.terminalFailure === true;
  const recoveryStepsAvailable = props.recoveryStepsAvailable === true;
  const actions: EnterpriseCompactEmptyStateAction[] = [];

  if (showFirstReviewGuide) {
    actions.push({
      label: "Open first-review guide",
      href: FIRST_REVIEW_GUIDE_PATH,
      variant: "outline" as const,
    });
  }

  const title = terminalFailure ? "Review did not finalize" : "Review not ready yet";
  const description = terminalFailure ? (
    <p className="m-0">
      This architecture review stopped before a sealed review record was produced.{" "}
      {recoveryStepsAvailable
        ? "Follow the recovery steps in Do this next above, then re-run the review."
        : "Use Do this next above to address what failed, then re-run the review."}{" "}
      Exports and custody records appear only after finalization.
    </p>
  ) : (
    <p className="m-0">
      This architecture review has not been finalized yet. After analysis completes and you finalize, the{" "}
      <InlineGlossaryChip nounId="sealed-review-record">{SIGNED_MANIFEST_LABEL.toLowerCase()}</InlineGlossaryChip>,{" "}
      <InlineGlossaryChip nounId="evidence-trail">evidence trail</InlineGlossaryChip>, and exports will appear here.
    </p>
  );

  return (
    <EnterpriseCompactEmptyState
      testId="run-detail-pre-finalized-empty-state"
      title={title}
      description={description}
      actions={actions}
    />
  );
}
