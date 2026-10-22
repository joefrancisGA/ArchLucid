import { describe, expect, it } from "vitest";

import type { PricingQuoteAgingDashboard, PricingQuoteAgingRow } from "@/lib/pricing-quote-aging";
import {
  buildPricingQuoteFollowUpSummaryTiles,
  extractEmailDomain,
  resolvePricingQuoteFollowUpHeadline,
  resolvePricingQuoteSlaBadge,
} from "@/lib/pricing-quote-follow-up-present";

function row(overrides: Partial<PricingQuoteAgingRow> = {}): PricingQuoteAgingRow {
  return {
    id: "1",
    createdUtc: "2026-07-01T12:00:00Z",
    ageHours: 2,
    breachStatus: "ok",
    workEmail: "buyer@acme.example",
    companyName: "Acme",
    tierInterest: "Team",
    status: "Open",
    firstResponseUtc: null,
    assignedOwner: null,
    ...overrides,
  };
}

function dashboard(overrides: Partial<PricingQuoteAgingDashboard> = {}): PricingQuoteAgingDashboard {
  return {
    rows: [],
    warnCount: 0,
    breachCount: 0,
    ...overrides,
  };
}

describe("pricing-quote-follow-up-present", () => {
  it("extracts email domain", () => {
    expect(extractEmailDomain("buyer@acme.example")).toBe("acme.example");
    expect(extractEmailDomain("invalid")).toBe(" — ");
  });

  it("maps SLA badges from breach status and age", () => {
    expect(resolvePricingQuoteSlaBadge(row({ ageHours: 1, breachStatus: "ok" }))).toBe("New");
    expect(resolvePricingQuoteSlaBadge(row({ ageHours: 10, breachStatus: "ok" }))).toBe("On track");
    expect(resolvePricingQuoteSlaBadge(row({ breachStatus: "warn at 18h" }))).toBe("Follow up soon");
    expect(resolvePricingQuoteSlaBadge(row({ breachStatus: "breach at 24h" }))).toBe("Past SLA");
    expect(resolvePricingQuoteSlaBadge(row({ firstResponseUtc: "2026-07-01T13:00:00Z" }))).toBe("Contacted");
  });

  it("builds headline for empty, warn, and breach states", () => {
    expect(resolvePricingQuoteFollowUpHeadline(dashboard()).message).toBe("No open pricing quote requests");
    expect(resolvePricingQuoteFollowUpHeadline(dashboard({ warnCount: 3 })).message).toBe(
      "3 requests nearing follow-up SLA",
    );
    expect(resolvePricingQuoteFollowUpHeadline(dashboard({ breachCount: 1 })).message).toBe(
      "1 request past follow-up SLA",
    );
  });

  it("builds operational summary tiles", () => {
    const tiles = buildPricingQuoteFollowUpSummaryTiles(
      dashboard({
        rows: [
          row({ ageHours: 20, breachStatus: "warn at 18h" }),
          row({ id: "2", ageHours: 5, assignedOwner: "sales@archlucid.net" }),
        ],
        warnCount: 1,
      }),
    );

    expect(tiles.map((tile) => tile.id)).toEqual(["open", "warn", "breach", "oldest", "unassigned"]);
    expect(tiles.find((tile) => tile.id === "open")?.value).toBe("2");
    expect(tiles.find((tile) => tile.id === "unassigned")?.value).toBe("1");
    expect(tiles.find((tile) => tile.id === "oldest")?.value).toBe("20.0h");
  });
});
