import { describe, expect, it } from "vitest";

import {
  countIntegrityPassedFindings,
  flattenArchitectureIntelligenceFindings,
  listIntegrityPassedFindingPreviews,
} from "@/lib/architecture/architecture-intelligence-findings";

describe("architecture-intelligence-findings", () => {
  const sampleResult = {
    integrityPassedFindingIds: ["f1", "f2"],
    specialistReviews: [
      {
        findings: [
          {
            findingId: "f1",
            title: "Missing authentication boundary",
            severity: "High",
            conclusion: "Public API lacks auth controls.",
          },
          {
            findingId: "f2",
            title: "Weak data residency posture",
            severity: "Medium",
            conclusion: "EU residency is asserted but not enforced.",
          },
          {
            findingId: "f3",
            title: "Heuristic only",
            severity: "Low",
            conclusion: "Not integrity-passed.",
          },
        ],
      },
    ],
  };

  it("flattens specialist findings with integrity flags", () => {
    const findings = flattenArchitectureIntelligenceFindings(sampleResult);

    expect(findings).toHaveLength(3);
    expect(findings[0]?.integrityPassed).toBe(true);
    expect(findings[2]?.integrityPassed).toBe(false);
  });

  it("lists only integrity-passed previews up to the limit", () => {
    const previews = listIntegrityPassedFindingPreviews(sampleResult, 1);

    expect(previews).toHaveLength(1);
    expect(previews[0]?.title).toBe("Missing authentication boundary");
    expect(countIntegrityPassedFindings(sampleResult)).toBe(2);
  });
});
