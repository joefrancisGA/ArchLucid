import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INTELLIGENCE_FINDING_CONCLUSION_NOT_STORED,
  ARCHITECTURE_INTELLIGENCE_FINDING_SEVERITY_NOT_STORED,
  ARCHITECTURE_INTELLIGENCE_FINDING_TITLE_NOT_STORED,
  ARCHITECTURE_INTELLIGENCE_INTEGRITY_PASSED_COUNT_NOT_STORED,
  countIntegrityPassedFindings,
  formatIntegrityPassedFindingCountDisplay,
  flattenArchitectureIntelligenceFindings,
  listIntegrityPassedFindingPreviews,
  resolveIntegrityPassedFindingIdsPresence,
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

  it("labels omitted finding fields without guessing severity or title", () => {
    const findings = flattenArchitectureIntelligenceFindings({
      integrityPassedFindingIds: ["f1"],
      specialistReviews: [{ findings: [{ findingId: "f1", title: " ", severity: " ", conclusion: "" }] }],
    });

    expect(findings[0]?.title).toBe(ARCHITECTURE_INTELLIGENCE_FINDING_TITLE_NOT_STORED);
    expect(findings[0]?.severity).toBeNull();
    expect(findings[0]?.conclusion).toBe(ARCHITECTURE_INTELLIGENCE_FINDING_CONCLUSION_NOT_STORED);
  });

  it("reports not stored when integrity-passed ids are omitted", () => {
    expect(
      formatIntegrityPassedFindingCountDisplay({
        specialistReviews: [{ findings: [{ findingId: "f1", title: "A", severity: "Low", conclusion: "B" }] }],
      }),
    ).toBe(ARCHITECTURE_INTELLIGENCE_INTEGRITY_PASSED_COUNT_NOT_STORED);
  });

  it("distinguishes omitted integrity id lists from stored empty lists", () => {
    expect(resolveIntegrityPassedFindingIdsPresence({ integrityPassedFindingIds: undefined }).kind).toBe(
      "omitted",
    );
    expect(resolveIntegrityPassedFindingIdsPresence({ integrityPassedFindingIds: [] })).toEqual({
      kind: "stored",
      count: 0,
    });
  });
});
