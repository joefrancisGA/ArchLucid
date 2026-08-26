"use client";

import type { ReactElement } from "react";

import {
  EnterpriseCompactEmptyState,
  type EnterpriseCompactEmptyStateAction,
} from "@/components/EnterpriseCompactEmptyState";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

export type RunDetailPreFinalizedEmptyStateProps = {
  readonly runId: string;
};

export function RunDetailPreFinalizedEmptyState(props: RunDetailPreFinalizedEmptyStateProps): ReactElement {
  const corePilot = useCorePilotDerivedStepStatus();
  const showFirstReviewGuide = !corePilot.isPending && corePilot.nextStepIndex !== null;

  const actions: EnterpriseCompactEmptyStateAction[] = [
    {
      label: "See pipeline / findings",
      href: buildReviewDetailTabHref(props.runId, "overview", { hash: "pipeline-timeline" }),
      variant: "primary" as const,
    },
  ];

  if (showFirstReviewGuide) {
    actions.push({
      label: "Open first-review guide",
      href: FIRST_REVIEW_GUIDE_PATH,
      variant: "outline" as const,
    });
  }

  return (
    <EnterpriseCompactEmptyState
      testId="run-detail-pre-finalized-empty-state"
      title="Review not ready yet"
      description={
        <p className="m-0">
          This architecture review has not been finalized yet. After the pipeline completes and you finalize, the{" "}
          <InlineGlossaryChip nounId="sealed-review-record">{SIGNED_MANIFEST_LABEL.toLowerCase()}</InlineGlossaryChip>,{" "}
          <InlineGlossaryChip nounId="evidence-trail">evidence trail</InlineGlossaryChip>, and exports will appear here.
        </p>
      }
      actions={actions}
    />
  );
}
