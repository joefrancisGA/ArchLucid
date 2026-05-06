import { describe, expect, it } from "vitest";

import {
  OPERATOR_CO_ARCHITECT_BRAND_LINE,
  OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY,
  OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY,
  OPERATOR_CO_ARCHITECT_CHECKLIST_KICKER,
  OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY,
} from "./operator-co-architect-copy";

describe("operator-co-architect-copy", () => {
  it("uses the resolved umbrella brand line with co-architect role noun", () => {
    expect(OPERATOR_CO_ARCHITECT_BRAND_LINE.toLowerCase()).toContain("co-architect");
    expect(OPERATOR_CO_ARCHITECT_BRAND_LINE).toMatch(/ArchLucid/);
  });

  it("avoids competing Microsoft-saturated role words in primary strings", () => {
    const bundle = [
      OPERATOR_CO_ARCHITECT_BRAND_LINE,
      OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY,
      OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY,
      OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY,
      OPERATOR_CO_ARCHITECT_CHECKLIST_KICKER,
    ].join(" ");

    expect(bundle.toLowerCase()).not.toContain("co-pilot");
    expect(bundle.toLowerCase()).not.toContain("copilot");
    expect(bundle.toLowerCase()).not.toMatch(/\bassistant\b/);
  });

  it("names review as the recommended first path on the home strip body", () => {
    expect(OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY.toLowerCase()).toMatch(/recommended first path/i);
    expect(OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY.toLowerCase()).toMatch(/architecture review/i);
  });

  it("uses review-primary CTA wording distinct from generic new review", () => {
    expect(OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY.toLowerCase()).toContain("architecture review");
    expect(OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY.toLowerCase()).not.toBe("new review");
  });
});
