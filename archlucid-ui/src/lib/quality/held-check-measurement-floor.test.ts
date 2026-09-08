import { describe, expect, it } from "vitest";

import { readHeldCheckLedgerFromFindingsSnapshot } from "@/lib/findings/read-held-check-ledger-from-findings-snapshot";
import { formatInsightDensityMeasurementFloorPresentation } from "@/lib/quality/insight-density-measurement-floor";

describe("held-check ledger (DX-52)", () => {
  it("reads rollup entries from findings snapshot curation", () => {
    const entries = readHeldCheckLedgerFromFindingsSnapshot({
      insightDensityCuration: {
        heldCheckLedgerEntries: [
          {
            inputCode: "azureInventoryZip",
            engineCount: 3,
            engineTypes: ["secrets-lifecycle", "orphaned-azure-resource"],
          },
        ],
      },
    });

    expect(entries).toEqual([
      {
        inputCode: "azureInventoryZip",
        engineCount: 3,
        engineTypes: ["secrets-lifecycle", "orphaned-azure-resource"],
      },
    ]);
  });

  it("adds unblock clause when top held-check count is at least two", () => {
    const presentation = formatInsightDensityMeasurementFloorPresentation(12, {
      heldCheckLedgerEntries: [
        {
          inputCode: "azureInventoryZip",
          engineCount: 4,
          engineTypes: ["secrets-lifecycle"],
        },
      ],
    });

    expect(presentation.topHeldCheckUnblockClause).toContain("Azure inventory ZIP");
    expect(presentation.line).toContain("would unblock 4 engines");
  });
});
