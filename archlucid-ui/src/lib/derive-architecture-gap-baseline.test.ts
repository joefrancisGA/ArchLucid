import { describe, expect, it } from "vitest";

import { deriveArchitectureGapBaselineFromSubmittedText, formatParsedSubmittedArchitectureName } from "@/lib/derive-architecture-gap-baseline";

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

  it("is idempotent when an imported actor already carries submitted-text provenance", () => {
    const label = "Payment gateway";
    const once = formatParsedSubmittedArchitectureName(label);
    const twice = formatParsedSubmittedArchitectureName(once);

    expect(once).toBe("Payment gateway (submitted text, not operator-asserted)");
    expect(twice).toBe(once);
    expect(twice.match(/\(submitted text, not operator-asserted\)/gu)?.length).toBe(1);
  });

  it("does not mistake partial provenance text for an already completed marker", () => {
    expect(formatParsedSubmittedArchitectureName("Payment gateway (submitted text")).toBe(
      "Payment gateway (submitted text (submitted text, not operator-asserted)",
    );
  });
});
