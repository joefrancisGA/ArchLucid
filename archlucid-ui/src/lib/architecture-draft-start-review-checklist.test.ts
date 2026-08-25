import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION,
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE,
  resolveArchitectureDraftStartReviewEmphasizedStepId,
  resolveArchitectureDraftStartReviewSteps,
} from "@/lib/architecture-draft-start-review-checklist";

describe("resolveArchitectureDraftStartReviewSteps", () => {
  it("exposes draft checklist copy that distinguishes page-local steps from workspace progress", () => {
    expect(ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE).toBe("Draft readiness checklist");
    expect(ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION).toContain("7 steps");
  });

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
