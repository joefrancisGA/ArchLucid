import { describe, expect, it } from "vitest";

import {
  buildSpecialtyReviewUseTemplateHref,
  resolveSpecialtyReviewCloudFromSearchParam,
  SPECIALTY_REVIEW_TEMPLATES,
} from "@/lib/specialty-review-templates";

describe("specialty-review-templates", () => {
  it("lists three supported specialty templates", () => {
    expect(SPECIALTY_REVIEW_TEMPLATES.map((row) => row.id)).toEqual([
      "saas-readiness",
      "ai-governance",
      "healthcare-claims",
    ]);
  });

  it("builds guided-intake href without cloud context", () => {
    expect(
      buildSpecialtyReviewUseTemplateHref({
        intakeTemplateId: "ai-governance",
      }),
    ).toBe("/architecture/reviews/new?path=guided-intake&template=ai-governance");
  });

  it("builds detailed wizard href when cloud context is selected", () => {
    expect(
      buildSpecialtyReviewUseTemplateHref({
        intakeTemplateId: "saas-readiness",
        cloudContext: "Aws",
      }),
    ).toBe("/architecture/reviews/new?path=detailed&cloud=aws&template=saas-readiness");
  });

  it("resolves cloud query values for review intake", () => {
    expect(resolveSpecialtyReviewCloudFromSearchParam("azure")).toBe("Azure");
    expect(resolveSpecialtyReviewCloudFromSearchParam("gcp")).toBe("Gcp");
    expect(resolveSpecialtyReviewCloudFromSearchParam("unknown")).toBeNull();
  });
});
