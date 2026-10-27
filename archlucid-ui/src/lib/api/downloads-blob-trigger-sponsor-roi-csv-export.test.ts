import { describe, expect, it } from "vitest";

import {
  formatSponsorRoiCsvCostEvidenceFreshnessLine,
  formatSponsorRoiCsvPreamble,
} from "@/lib/api/downloads-blob-trigger-sponsor-roi-csv-export";

describe("formatSponsorRoiCsvPreamble", () => {
  it("uses omission copy only for missing pricing metadata and preserves zero", () => {
    expect(formatSponsorRoiCsvPreamble({ savingsPricingBasis: null, eaDiscountMultiplier: null })).toContain(
      "Pricing basis was not stored. (EA discount multiplier was not stored.)",
    );
    expect(formatSponsorRoiCsvPreamble({ savingsPricingBasis: "Retail", eaDiscountMultiplier: 0 })).toContain(
      "Retail (EA discount multiplier 0)",
    );
  });

  it("always includes cost evidence freshness honesty (P-06)", () => {
    expect(formatSponsorRoiCsvPreamble({})).toContain("Cost evidence freshness was not stored.");
    expect(formatSponsorRoiCsvPreamble({ costEvidenceFreshnessStatus: "" })).toContain(
      "Cost evidence freshness was stored empty.",
    );
    expect(formatSponsorRoiCsvCostEvidenceFreshnessLine("Fresh")).toBe("Cost evidence freshness: Fresh");
  });
});
