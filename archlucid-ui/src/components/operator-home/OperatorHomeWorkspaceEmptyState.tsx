"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import {
  OpenSampleReviewLink,
  OPEN_SAMPLE_REVIEW_HREF,
} from "@/components/operator/OpenSampleReviewLink";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { Button } from "@/components/ui/button";
import { useWorkingCareerRehearsalDoor } from "@/hooks/use-working-career-rehearsal-door";
import {
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA } from "@/lib/buyer-copy/operator-home-sample";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  OPERATOR_HOME_WORKSPACE_EMPTY_PRACTICE_HONESTY_SENTENCE,
  OPERATOR_HOME_WORKSPACE_EMPTY_PRACTICE_HONESTY_TEST_ID,
  shouldShowOperatorHomeWorkspaceEmptyPracticeHonesty,
} from "@/lib/operator/operator-home-workspace-empty-practice-honesty";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

/** First-run workspace with no reviews — compact empty pattern with direct start paths. */
export function OperatorHomeWorkspaceEmptyState() {
  const { mode, mounted: workspaceMounted } = useWorkspaceMode();
  const { door, mounted: doorMounted } = useWorkingCareerRehearsalDoor();
  const showPracticeHonesty =
    workspaceMounted
    && doorMounted
    && shouldShowOperatorHomeWorkspaceEmptyPracticeHonesty({
      workingMode: isWorkingWorkspaceMode(mode),
      selectedDoor: door,
    });

  return (
    <EnterpriseCompactEmptyState
      testId="operator-home-workspace-empty-state"
      title={OPERATOR_HOME_WORKSPACE_EMPTY_TITLE}
      description={
        <>
          {showPracticeHonesty ? (
            <p
              className={OPERATOR_TYPOGRAPHY.helper}
              data-testid={OPERATOR_HOME_WORKSPACE_EMPTY_PRACTICE_HONESTY_TEST_ID}
              role="note"
            >
              {OPERATOR_HOME_WORKSPACE_EMPTY_PRACTICE_HONESTY_SENTENCE}
            </p>
          ) : null}
          {OPERATOR_HOME_WORKSPACE_EMPTY_BODY}{" "}
          {showPracticeHonesty ? (
            "Use Record when you are ready to seal proof."
          ) : (
            <>
              When you finalize, you produce a{" "}
              <InlineGlossaryChip nounId="sealed-review-record">finalized review record</InlineGlossaryChip> backed by an{" "}
              <InlineGlossaryChip nounId="evidence-trail">evidence trail</InlineGlossaryChip> and optional{" "}
              <InlineGlossaryChip nounId="governance-approval">approval</InlineGlossaryChip>.
            </>
          )}
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
