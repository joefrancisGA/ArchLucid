import { describe, expect, it } from "vitest";

import {
  RISK_EXCEPTIONS_FINDINGS_COMPACT_LINE,
  RISK_EXCEPTIONS_FINDINGS_FINDINGS_LINK,
  RISK_EXCEPTIONS_FINDINGS_HEADING,
  RISK_EXCEPTIONS_FINDINGS_RISK_EXCEPTIONS_LINK,
  RISK_EXCEPTIONS_FINDINGS_WHY_TWO,
  buildRiskExceptionsFindingsVocabulary,
  resolveRiskExceptionsFindingsPeerLink,
} from "@/lib/risk-exceptions-findings-vocabulary";
import {
  GOVERNANCE_EXCEPTIONS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance-route-paths";

describe("risk-exceptions-findings-vocabulary (TB-2249)", () => {
  it("explains why risk exceptions and findings stay separate and deep-links both", () => {
    const model = buildRiskExceptionsFindingsVocabulary();

    expect(model.heading).toBe(RISK_EXCEPTIONS_FINDINGS_HEADING);
    expect(model.heading.toLowerCase()).toContain("risk exceptions");
    expect(model.whyTwo).toBe(RISK_EXCEPTIONS_FINDINGS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("waiver");
    expect(model.whyTwo.toLowerCase()).toContain("finding");
    expect(model.whyTwo.toLowerCase()).toContain("disposition");
    expect(model.compactLine).toBe(RISK_EXCEPTIONS_FINDINGS_COMPACT_LINE);

    expect(model.riskExceptionsLink).toEqual(RISK_EXCEPTIONS_FINDINGS_RISK_EXCEPTIONS_LINK);
    expect(model.riskExceptionsLink.href).toBe(GOVERNANCE_EXCEPTIONS_PATH);
    expect(model.riskExceptionsLink.href).toBe("/governance/exceptions");

    expect(model.findingsLink).toEqual(RISK_EXCEPTIONS_FINDINGS_FINDINGS_LINK);
    expect(model.findingsLink.href).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(model.findingsLink.href).toBe("/governance/findings");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveRiskExceptionsFindingsPeerLink("risk-exceptions")).toEqual(
      RISK_EXCEPTIONS_FINDINGS_FINDINGS_LINK,
    );
    expect(resolveRiskExceptionsFindingsPeerLink("findings-queue")).toEqual(
      RISK_EXCEPTIONS_FINDINGS_RISK_EXCEPTIONS_LINK,
    );
  });
});
