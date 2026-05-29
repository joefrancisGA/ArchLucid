import { describe, expect, it } from "vitest";

import {
  OPERATOR_CO_ARCHITECT_BRAND_LINE,
  OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY,
  OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY,
  OPERATOR_CO_ARCHITECT_CHECKLIST_KICKER,
  OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY,
} from "./operator-co-architect-copy";

describe("operator-co-architect-copy", () => {
  it("leads with architecture review workspace value proposition", () => {
    expect(OPERATOR_CO_ARCHITECT_BRAND_LINE).toBe("Architecture review workspace");
    expect(OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY.toLowerCase()).toContain("audit-ready decision records");
    expect(OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY.toLowerCase()).toContain("governance approval");
  });

  it("avoids generic AI assistant and co-architect framing in primary strings", () => {
    const bundle = [
      OPERATOR_CO_ARCHITECT_BRAND_LINE,
      OPERATOR_CO_ARCHITECT_HOME_STRIP_BODY,
      OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY,
      OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY,
      OPERATOR_CO_ARCHITECT_CHECKLIST_KICKER,
    ].join(" ");

    expect(bundle.toLowerCase()).not.toContain("co-architect");
    expect(bundle.toLowerCase()).not.toContain("co-pilot");
    expect(bundle.toLowerCase()).not.toContain("copilot");
    expect(bundle.toLowerCase()).not.toMatch(/\bassistant\b/);
  });

  it("uses evidence-first CTA wording distinct from generic new review", () => {
    expect(OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY.toLowerCase()).toContain("evidence");
    expect(OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY.toLowerCase()).not.toBe("new review");
  });
});
