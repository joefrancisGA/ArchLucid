"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import {
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const sampleReviewHref = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

/** First-run workspace with no reviews — compact empty pattern with direct start paths. */
export function OperatorHomeWorkspaceEmptyState() {
  return (
    <EnterpriseCompactEmptyState
      testId="operator-home-workspace-empty-state"
      title={OPERATOR_HOME_WORKSPACE_EMPTY_TITLE}
      description={
        <>
          {OPERATOR_HOME_WORKSPACE_EMPTY_BODY} When you finalize, you produce a{" "}
          <InlineGlossaryChip nounId="sealed-review-record">finalized review record</InlineGlossaryChip> backed by an{" "}
          <InlineGlossaryChip nounId="evidence-trail">evidence trail</InlineGlossaryChip> and optional{" "}
          <InlineGlossaryChip nounId="governance-approval">approval</InlineGlossaryChip>.
        </>
      }
      actions={[
        { label: "Start first review", href: "/architecture/reviews/new", variant: "primary" },
        { label: "Open sample review", href: sampleReviewHref, variant: "outline" },
      ]}
    />
  );
}
