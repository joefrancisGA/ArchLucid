import { describe, expect, it } from "vitest";

import { formatSponsorRoiCsvPreamble } from "@/lib/api/downloads-blob-trigger-sponsor-roi-csv-export";

describe("formatSponsorRoiCsvPreamble", () => {
  it("uses omission copy only for missing pricing metadata and preserves zero", () => {
    expect(formatSponsorRoiCsvPreamble({ savingsPricingBasis: null, eaDiscountMultiplier: null })).toContain(
      "Pricing basis was not stored. (EA discount multiplier was not stored.)",
    );
    expect(formatSponsorRoiCsvPreamble({ savingsPricingBasis: "Retail", eaDiscountMultiplier: 0 })).toContain(
      "Retail (EA discount multiplier 0)",
    );
  });
});
