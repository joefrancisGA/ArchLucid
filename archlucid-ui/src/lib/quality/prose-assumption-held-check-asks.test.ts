import { describe, expect, it } from "vitest";

import { readProseAssumptionHeldCheckAsksFromFindingsSnapshot } from "@/lib/findings/read-prose-assumption-held-check-asks-from-findings-snapshot";
import { formatInsightDensityMeasurementFloorPresentation } from "@/lib/quality/insight-density-measurement-floor";

describe("prose assumption held-check asks (DX-66)", () => {
  it("reads held-check asks from findings snapshot curation", () => {
    const asks = readProseAssumptionHeldCheckAsksFromFindingsSnapshot({
      insightDensityCuration: {
        proseAssumptionHeldCheckAsks: [
          {
            inputCode: "azureInventoryZip",
            statement: "Payment SQL must not be public.",
            evidenceRef: "doc:architecture.md#L12",
          },
        ],
      },
    });

    expect(asks).toEqual([
      {
        inputCode: "azureInventoryZip",
        statement: "Payment SQL must not be public.",
        evidenceRef: "doc:architecture.md#L12",
      },
    ]);
  });

  it("adds held-check ask clause to measurement floor line", () => {
    const presentation = formatInsightDensityMeasurementFloorPresentation(12, {
      proseAssumptionHeldCheckAsks: [
        {
          inputCode: "azureInventoryZip",
          statement: "Payment SQL must not be public.",
          evidenceRef: "doc:architecture.md#L12",
        },
      ],
    });

    expect(presentation.proseAssumptionHeldCheckClause).toContain("Azure inventory ZIP");
    expect(presentation.line).toContain("Upload Azure inventory ZIP to verify");
    expect(presentation.line).toContain("doc:architecture.md#L12");
  });
});
