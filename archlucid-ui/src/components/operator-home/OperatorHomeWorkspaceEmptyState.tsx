"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import {
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";

/** First-run workspace with no reviews — compact empty pattern; primary paths live in the hero. */
export function OperatorHomeWorkspaceEmptyState() {
  return (
    <EnterpriseCompactEmptyState
      testId="operator-home-workspace-empty-state"
      title={OPERATOR_HOME_WORKSPACE_EMPTY_TITLE}
      description={
        <>
          {OPERATOR_HOME_WORKSPACE_EMPTY_BODY} When you finalize, you produce a{" "}
          <InlineGlossaryChip nounId="sealed-review-record">sealed review record</InlineGlossaryChip> backed by an{" "}
          <InlineGlossaryChip nounId="evidence-trail">evidence trail</InlineGlossaryChip> and optional{" "}
          <InlineGlossaryChip nounId="governance-approval">governance approval</InlineGlossaryChip>.
        </>
      }
    />
  );
}
