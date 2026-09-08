import { describe, expect, it } from "vitest";

import {
  architectureIdentityPath,
  architectureNestedFindingsPath,
  architectureNestedReviewPath,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";
import {
  GETTING_STARTED_HELP_WORKING_EXAMPLE_ARCHITECTURE_ID,
  resolveGettingStartedHelpPipelineDiagramAccessibleName,
  resolveGettingStartedHelpPipelineIntro,
  resolveGettingStartedHelpPipelineTextStages,
  resolveGettingStartedHelpPrimaryActions,
  resolveGettingStartedHelpWorkflowSteps,
} from "@/lib/getting-started-help-guide-content";
import { WORKING_REVIEWS_INBOX_NAV_LABEL } from "@/lib/operator/operator-nav-labels";
import { CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";

describe("getting-started help Working examples (SY-87)", () => {
  it("uses architecture nested URLs in Working workflow steps instead of peer review Home links", () => {
    const steps = resolveGettingStartedHelpWorkflowSteps(true);

    expect(steps[0]?.href).toBe(ARCHITECTURES_NEW_PATH);
    expect(steps[1]?.href).toBe(architectureIdentityPath(GETTING_STARTED_HELP_WORKING_EXAMPLE_ARCHITECTURE_ID));
    expect(steps[2]?.href).toBe(architectureNestedFindingsPath(GETTING_STARTED_HELP_WORKING_EXAMPLE_ARCHITECTURE_ID));
    expect(steps[4]?.href).toBe(
      architectureNestedReviewPath(
        GETTING_STARTED_HELP_WORKING_EXAMPLE_ARCHITECTURE_ID,
        CUSTOMER_INTAKE_SAMPLE_RUN_ID,
      ),
    );

    for (const step of steps) {
      expect(step.href).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
    }
  });

  it("labels the inbox explicitly in Working primary actions", () => {
    const inboxAction = resolveGettingStartedHelpPrimaryActions(true).find(
      (action) => action.href === REVIEWS_LIST_PATH,
    );

    expect(inboxAction?.title).toBe(WORKING_REVIEWS_INBOX_NAV_LABEL);
    expect(inboxAction?.ctaLabel).toBe(WORKING_REVIEWS_INBOX_NAV_LABEL);
  });

  it("keeps Guided workflow steps on peer review URLs", () => {
    const steps = resolveGettingStartedHelpWorkflowSteps(false);

    expect(steps[1]?.href).toBe(REVIEWS_LIST_PATH);
    expect(steps[0]?.href).toBe("/architecture/reviews/new");
  });

  it("uses review-progress vocabulary on Working getting-started pipeline copy (WS-16)", () => {
    const stages = resolveGettingStartedHelpPipelineTextStages(true);

    expect(resolveGettingStartedHelpPipelineIntro(true)).not.toContain("Authority pipeline");
    expect(resolveGettingStartedHelpPipelineDiagramAccessibleName(true)).toBe("Architecture review progress");
    expect(stages.join(" ")).not.toContain("Authority pipeline");
    expect(stages.join(" ")).toContain("Review analysis stages");
  });
});
