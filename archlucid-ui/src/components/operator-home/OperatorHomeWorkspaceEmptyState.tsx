"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import {
  OpenSampleReviewLink,
  OPEN_SAMPLE_REVIEW_HREF,
} from "@/components/operator/OpenSampleReviewLink";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA } from "@/lib/buyer-copy/operator-home-sample";

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
      actions={[{ label: "Start first review", href: "/architecture/reviews/new", variant: "primary" }]}
      footer={
        <Button type="button" variant="outline" size="sm" asChild data-testid="operator-home-open-sample-review">
          <OpenSampleReviewLink href={OPEN_SAMPLE_REVIEW_HREF}>
            {OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA}
          </OpenSampleReviewLink>
        </Button>
      }
    />
  );
}
