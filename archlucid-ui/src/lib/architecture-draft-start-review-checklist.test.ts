import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION,
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_PAGE_LOCAL,
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_WITH_BANNER,
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE,
  resolveArchitectureDraftStartReviewChecklistDescription,
  resolveArchitectureDraftStartReviewEmphasizedStepId,
  resolveArchitectureDraftStartReviewSteps,
} from "@/lib/architecture-draft-start-review-checklist";

describe("resolveArchitectureDraftStartReviewSteps", () => {
  it("exposes draft checklist copy that distinguishes page-local steps from workspace progress", () => {
    expect(ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE).toBe("Draft readiness checklist");
    expect(ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION).toContain("7 steps");
    expect(resolveArchitectureDraftStartReviewChecklistDescription(true)).toBe(
      ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_WITH_BANNER,
    );
    expect(resolveArchitectureDraftStartReviewChecklistDescription(false)).toBe(
      ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_PAGE_LOCAL,
    );
    expect(resolveArchitectureDraftStartReviewChecklistDescription(false)).not.toContain("banner above");
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
