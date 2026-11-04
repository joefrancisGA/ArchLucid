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
      businessOutcome: true,
      peopleAndSystems: true,
    });
  });

  it("keeps integration narrative as one label instead of splitting on commas (P-07)", () => {
    const derived = deriveArchitectureGapBaselineFromSubmittedText(`## External integrations
Payment gateway, CRM sync, and legacy batch feed`);

    expect(derived.keyIntegrations).toEqual([
      "Payment gateway, CRM sync, and legacy batch feed",
    ]);
  });
});
