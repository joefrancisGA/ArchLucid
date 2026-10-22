import { describe, expect, it } from "vitest";

import {
  OPERATOR_HOME_EXAMPLE_DESCRIPTION,
  OPERATOR_HOME_EXAMPLE_QUERY_VALUE,
  OPERATOR_HOME_EXAMPLE_RUN_DESCRIPTION_TOKEN,
  OPERATOR_HOME_EXAMPLE_START_CTA,
  OPERATOR_HOME_EXAMPLE_SYSTEM_NAME,
  OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
  resolveReviewIntakeExampleTemplate,
  resolveReviewIntakeExampleTemplateFromSearchParams,
  reviewIntakeExampleTemplateHref,
} from "@/lib/operator/operator-home-example-request";

describe("operator-home-example-request", () => {
  it("uses buyer-safe example copy with no GitHub references", () => {
    const surfaces = [
      OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
      OPERATOR_HOME_EXAMPLE_QUERY_VALUE,
      OPERATOR_HOME_EXAMPLE_DESCRIPTION,
      OPERATOR_HOME_EXAMPLE_SYSTEM_NAME,
      OPERATOR_HOME_EXAMPLE_RUN_DESCRIPTION_TOKEN,
      OPERATOR_HOME_EXAMPLE_START_CTA,
    ];

    for (const text of surfaces) {
      expect(text.toLowerCase()).not.toContain("github");
    }
  });

  it("keeps home card copy aligned with the customer intake template registry entry", () => {
    expect(OPERATOR_HOME_EXAMPLE_DESCRIPTION).toContain("enterprise customer intake modernization");
    expect(OPERATOR_HOME_EXAMPLE_SYSTEM_NAME).toBe("Enterprise Customer Intake Modernization");
    expect(reviewIntakeExampleTemplateHref(OPERATOR_HOME_EXAMPLE_TEMPLATE_ID)).toBe(
      "/architecture/reviews/new?template=customer-intake-modernization",
    );
  });

  it("resolves template and legacy example query params", () => {
    expect(
      resolveReviewIntakeExampleTemplate({ templateParam: "customer-intake-modernization" })?.title,
    ).toBe("Enterprise customer intake");
    expect(resolveReviewIntakeExampleTemplate({ templateParam: "saas-readiness" })?.title).toBe("SaaS readiness");
    expect(resolveReviewIntakeExampleTemplate({ templateParam: "ai-governance" })?.title).toBe("AI policy");
    expect(resolveReviewIntakeExampleTemplate({ exampleParam: "healthcare-claims-intake" })?.id).toBe(
      "customer-intake-modernization",
    );
    expect(resolveReviewIntakeExampleTemplate({ templateParam: "unknown-template" })).toBeNull();
  });

  it("reports invalid template ids without throwing", () => {
    expect(
      resolveReviewIntakeExampleTemplateFromSearchParams((key) =>
        key === "template" ? "not-a-real-template" : null,
      ),
    ).toEqual({
      template: null,
      invalidTemplateId: "not-a-real-template",
    });
  });
});
