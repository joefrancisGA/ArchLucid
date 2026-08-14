import { describe, expect, it } from "vitest";

import {
  buildSpecialtyReviewUseTemplateHref,
  resolveSpecialtyReviewCloudFromSearchParam,
  resolveSpecialtyReviewPolicyPackHref,
  SPECIALTY_REVIEW_TEMPLATES,
  specialtyReviewTemplatesCompareHref,
} from "@/lib/specialty-review-templates";

describe("specialty-review-templates", () => {
  it("lists three supported specialty templates", () => {
    expect(SPECIALTY_REVIEW_TEMPLATES.map((row) => row.id)).toEqual([
      "saas-readiness",
      "ai-governance",
      "healthcare-claims",
    ]);
  });

  it("defines policy pack provenance on every template", () => {
    for (const template of SPECIALTY_REVIEW_TEMPLATES) {
      expect(template.policyPacks.length).toBeGreaterThanOrEqual(1);
      expect(template.lastReviewedUtc.trim().length).toBeGreaterThan(0);

      for (const pack of template.policyPacks) {
        expect(pack.href).toMatch(/^\/governance\/policy-packs/);
        expect(pack.label.trim().length).toBeGreaterThan(0);
        expect(pack.version.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("routes specialty pack citations to resolvable governance surfaces", () => {
    expect(resolveSpecialtyReviewPolicyPackHref("demo-enterprise-privacy-pack")).toBe(
      "/governance/policy-packs/demo-enterprise-privacy-pack",
    );
    expect(resolveSpecialtyReviewPolicyPackHref("1")).toBe("/governance/policy-packs/1");
    expect(resolveSpecialtyReviewPolicyPackHref("saas-security-controls")).toBe("/governance/policy-packs");
  });

  it("links compare templates to the comparison anchor", () => {
    expect(specialtyReviewTemplatesCompareHref()).toContain("#specialty-template-comparison");
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
