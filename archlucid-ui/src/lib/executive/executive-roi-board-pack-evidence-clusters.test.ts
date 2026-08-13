import { describe, expect, it } from "vitest";

import {
  boardPackClusterPostureLabel,
  buildBoardPackEvidenceClusterRows,
} from "@/lib/executive/executive-roi-board-pack-evidence-clusters";
import type { ExecutiveRoiSummary } from "@/lib/executive/executive-summary-markdown";

function baseSummary(overrides: Partial<ExecutiveRoiSummary> = {}): ExecutiveRoiSummary {
  return {
    totalEstimatedUsdSavings: 1000,
    systemCount: 1,
    latestRunCount: 1,
    eaDiscountMultiplier: 1,
    savingsPricingBasis: "Retail",
    systems: [],
    topSystemicIssues: [],
    ...overrides,
  };
}

describe("buildBoardPackEvidenceClusterRows", () => {
  it("marks cost cluster extractor-backed when evidence is fresh", () => {
    const rows = buildBoardPackEvidenceClusterRows(
      baseSummary({
        costEvidenceFreshnessStatus: "Fresh",
        businessImpactCategoryCounts: { costThemeCount: 3, securityComplianceThemeCount: 0, reliabilityThemeCount: 0 },
        topSystemicIssues: [{ category: "Cost optimization", severity: "Warning", count: 3 }],
      }),
    );

    expect(rows[0]?.posture).toBe("extractor-backed");
    expect(boardPackClusterPostureLabel(rows[0]!.posture)).toBe("Extractor-backed");
  });

  it("marks cost cluster illustrative when basis is demo", () => {
    const rows = buildBoardPackEvidenceClusterRows(
      baseSummary({
        savingsPricingBasis: "Illustrative demo",
        topSystemicIssues: [{ category: "Cost", severity: "Warning", count: 2 }],
      }),
    );

    expect(rows[0]?.posture).toBe("illustrative");
  });

  it("marks non-cost clusters as review-backed", () => {
    const rows = buildBoardPackEvidenceClusterRows(
      baseSummary({
        topSystemicIssues: [
          { category: "Security architecture", severity: "Critical", count: 4 },
          { category: "Cost", severity: "Warning", count: 1 },
        ],
      }),
    );

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.clusterLabel === "Security architecture")?.posture).toBe("review-backed");
    expect(rows.find((row) => row.clusterLabel === "Cost optimization")?.posture).toBe("illustrative");
  });
});
