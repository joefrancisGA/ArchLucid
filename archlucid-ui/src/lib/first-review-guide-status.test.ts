import { describe, expect, it } from "vitest";

import { architectureNestedReviewPath } from "@/lib/architecture/architecture-routes";
import {
  resolveFirstReviewGuideHeaderActions,
  resolveFirstReviewGuideRunHref,
  resolveFirstReviewGuideSteps,
} from "@/lib/first-review-guide-status";

const architectureId = "architecture-identity-001";

const baseContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: "run-123",
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: true,
  sealedReviewRecord: null,
};

describe("first-review-guide-status Working hrefs (SY-18)", () => {
  it("uses nested review URLs on Working when architectureId is known", () => {
    const input = {
      commitContext: baseContext,
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
      workingMode: true,
      architectureId,
    };

    expect(resolveFirstReviewGuideRunHref("run-123", input)).toBe(
      architectureNestedReviewPath(architectureId, "run-123"),
    );

    const steps = resolveFirstReviewGuideSteps(input);

    expect(steps[3]?.actionHref).toBe(
      `${architectureNestedReviewPath(architectureId, "run-123")}?reviewTab=findings`,
    );
    expect(steps[5]?.actionHref).toBe(
      `${architectureNestedReviewPath(architectureId, "run-123")}#finalize-review`,
    );
  });

  it("keeps peer review URLs in Guided mode", () => {
    const input = {
      commitContext: baseContext,
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
      workingMode: false,
      architectureId,
    };

    expect(resolveFirstReviewGuideRunHref("run-123", input)).toBe("/architecture/reviews/run-123");
  });

  it("header actions open nested review on Working", () => {
    const actions = resolveFirstReviewGuideHeaderActions({
      commitContext: baseContext,
      canExecute: true,
      finishSetupContext: null,
      finishSetupLoaded: true,
      workingMode: true,
      architectureId,
    });

    expect(actions.primaryHref).toBe(architectureNestedReviewPath(architectureId, "run-123"));
    expect(actions.primaryHref).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
  });
});
