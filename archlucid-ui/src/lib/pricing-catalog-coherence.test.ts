import { describe, expect, it } from "vitest";

import {
  assertIncludedUsersMatchArchitectSeats,
  computePricingCatalogUnitRates,
  findPricingCatalogLadderViolations,
} from "@/lib/pricing-catalog-coherence";
import type { PricingDoc } from "@/lib/pricing-types";
import pricingJson from "../../public/pricing.json";

const pricing = pricingJson as PricingDoc;

describe("pricing-catalog-coherence (TB-1166)", () => {
  it("keeps includedUsers aligned with includedArchitectSeats when both are set", () => {
    expect(assertIncludedUsersMatchArchitectSeats(pricing)).toEqual([]);
  });

  it("makes Team→Professional strictly better on seat, credit, and review unit rates", () => {
    const team = pricing.packages.find((pkg) => pkg.id === "team");
    const professional = pricing.packages.find((pkg) => pkg.id === "professional");

    if (team === undefined || professional === undefined) {
      throw new Error("Expected team and professional packages in pricing.json.");
    }

    const teamRates = computePricingCatalogUnitRates(team);
    const professionalRates = computePricingCatalogUnitRates(professional);

    for (const kind of ["seat", "credit", "review"] as const) {
      const teamRate = teamRates.find((rate) => rate.kind === kind);
      const professionalRate = professionalRates.find((rate) => rate.kind === kind);

      expect(teamRate, `team ${kind} rate`).toBeDefined();
      expect(professionalRate, `professional ${kind} rate`).toBeDefined();
      expect(professionalRate!.usdPerUnit).toBeLessThan(teamRate!.usdPerUnit);
    }
  });

  it("guards the published catalog ladder (exceptions only for documented solo-entry skew)", () => {
    expect(findPricingCatalogLadderViolations(pricing)).toEqual([]);
  });

  it("flags an inverted Team→Professional catalog without an exception", () => {
    const inverted: PricingDoc = {
      ...pricing,
      packages: pricing.packages.map((pkg) =>
        pkg.id === "team"
          ? { ...pkg, planMonthlyUsd: 249, includedUsers: 5, monthlyAiCredits: 2500, includedReviewsPerMonth: 20 }
          : pkg,
      ),
    };

    const violations = findPricingCatalogLadderViolations(inverted);
    expect(violations.some((row) => row.fromId === "team" && row.toId === "professional")).toBe(true);
  });
});
