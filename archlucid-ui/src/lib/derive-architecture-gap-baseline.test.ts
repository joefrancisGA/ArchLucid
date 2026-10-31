import { describe, expect, it } from "vitest";

import { deriveArchitectureGapBaselineFromSubmittedText } from "@/lib/derive-architecture-gap-baseline";

describe("deriveArchitectureGapBaselineFromSubmittedText", () => {
  it("suppresses gap assertion when submitted architecture text is absent", () => {
    const derived = deriveArchitectureGapBaselineFromSubmittedText(null);

    expect(derived.gapAssertion).toEqual({
      businessOutcome: false,
      peopleAndSystems: false,
    });
  });

  it("derives business outcome and people from submitted markdown sections", () => {
    const derived = deriveArchitectureGapBaselineFromSubmittedText(`## Business outcome
Reduce manual triage time for claims analysts.

## Users and stakeholders
- Claims analyst
- Partner billing API`);

    expect(derived.businessOutcome).toContain("Reduce manual triage");
    expect(derived.peopleAndSystems.length).toBeGreaterThan(0);
    expect(derived.gapAssertion).toEqual({
      businessOutcome: false,
      peopleAndSystems: false,
    });
    expect(derived.peopleAndSystems[0]?.fromSubmittedParse).toBe(true);
  });

  it("derives key integrations from external integrations section (P-08)", () => {
    const derived = deriveArchitectureGapBaselineFromSubmittedText(`## External integrations
- Payment gateway
- CRM export`);

    expect(derived.keyIntegrations).toEqual(["Payment gateway", "CRM export"]);
  });
});
