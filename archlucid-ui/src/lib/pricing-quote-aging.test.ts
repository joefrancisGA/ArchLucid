import { describe, expect, it } from "vitest";

import { sortPricingQuoteAgingRows, type PricingQuoteAgingRow } from "@/lib/pricing-quote-aging";

describe("sortPricingQuoteAgingRows", () => {
  it("orders breach before warn before ok", () => {
    const rows: PricingQuoteAgingRow[] = [
      {
        id: "1",
        createdUtc: "2026-01-01T00:00:00Z",
        ageHours: 10,
        breachStatus: "ok",
        workEmail: "a@example.com",
        companyName: "A",
        tierInterest: "Team",
      },
      {
        id: "2",
        createdUtc: "2026-01-01T00:00:00Z",
        ageHours: 30,
        breachStatus: "breach at 24h",
        workEmail: "b@example.com",
        companyName: "B",
        tierInterest: "Pro",
      },
      {
        id: "3",
        createdUtc: "2026-01-01T00:00:00Z",
        ageHours: 20,
        breachStatus: "warn at 18h",
        workEmail: "c@example.com",
        companyName: "C",
        tierInterest: "Enterprise",
      },
    ];

    const sorted = sortPricingQuoteAgingRows(rows);

    expect(sorted.map((row) => row.breachStatus)).toEqual(["breach at 24h", "warn at 18h", "ok"]);
  });
});
