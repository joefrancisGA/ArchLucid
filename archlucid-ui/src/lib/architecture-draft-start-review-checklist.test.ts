import { describe, expect, it } from "vitest";

import {
  resolveArchitectureDraftStartReviewEmphasizedStepId,
  resolveArchitectureDraftStartReviewSteps,
} from "@/lib/architecture-draft-start-review-checklist";

describe("resolveArchitectureDraftStartReviewSteps", () => {
  it("emphasizes scope before readiness", () => {
    expect(
      resolveArchitectureDraftStartReviewEmphasizedStepId({
        nameAndScopeConfigured: false,
        qualityReadinessConfigured: false,
        reviewStarted: false,
      }),
    ).toBe("scope");

    expect(
      resolveArchitectureDraftStartReviewSteps({
        nameAndScopeConfigured: true,
        qualityReadinessConfigured: false,
        reviewStarted: false,
      }).find((step) => step.id === "readiness")?.complete,
    ).toBe(false);
  });
});
