import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpecialtyTemplatePolicyPackProvenance } from "@/components/help/SpecialtyTemplatePolicyPackProvenance";
import { SPECIALTY_REVIEW_TEMPLATES } from "@/lib/specialty-review-templates";

describe("SpecialtyTemplatePolicyPackProvenance", () => {
  const template = SPECIALTY_REVIEW_TEMPLATES[0];

  it("renders pack links and last-reviewed stamp when not loading", () => {
    render(
      <SpecialtyTemplatePolicyPackProvenance
        policyPacks={template.policyPacks}
        lastReviewedUtc={template.lastReviewedUtc}
        testId="specialty-template-policy-packs-saas-readiness"
      />,
    );

    expect(screen.getByText(/Backed by/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /SaaS Security Controls v2\.1\.0/i })).toBeInTheDocument();
    expect(screen.getByText(/Pack guidance last reviewed/i)).toBeInTheDocument();
    expect(screen.queryByTestId("specialty-template-policy-pack-provenance-loading")).not.toBeInTheDocument();
  });

  it("shows a loading label instead of pack links while authority is resolving", () => {
    render(
      <SpecialtyTemplatePolicyPackProvenance
        policyPacks={template.policyPacks}
        lastReviewedUtc={template.lastReviewedUtc}
        isLoading
        testId="specialty-template-policy-packs-saas-readiness"
      />,
    );

    expect(screen.getByTestId("specialty-template-policy-pack-provenance-loading")).toHaveTextContent(
      /loading policy pack guidance/i,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
