import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from ".././quick-decision-summary-derive";

import {
  hasFindingsWhatIfAnalysisContent,
  readFindingProjectedImpactInterval,
  readFindingProjectedImpactUsd,
  rollupWhatIfSelectedProjectedSavingsUsd,
} from "./findings-what-if-analysis";

function buildFinding(findingId: string, wireJson: string): QuickDecisionFinding {
  return {
    findingId,
    title: `Finding ${findingId}`,
    recommendation: "Do the thing.",
    severityValue: 3,
    findingOrder: 0,
    aiReasoning: { wireJson, reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
  };
}

describe("findings-what-if-analysis", () => {
  it("readFindingProjectedImpactUsd returns null for unparsable or absent impact", () => {
    expect(readFindingProjectedImpactUsd(buildFinding("f1", "not json"))).toBeNull();
    expect(readFindingProjectedImpactUsd(buildFinding("f2", "{}"))).toBeNull();
    expect(readFindingProjectedImpactUsd(buildFinding("f3", '{"projectedImpactUsd":"1200"}'))).toBeNull();
  });

  it("readFindingProjectedImpactUsd returns zero when the wire stores zero", () => {
    expect(readFindingProjectedImpactUsd(buildFinding("f0", '{"projectedImpactUsd":0}'))).toBe(0);
  });

  it("readFindingProjectedImpactUsd reads the finite wire value", () => {
    expect(readFindingProjectedImpactUsd(buildFinding("f1", '{"projectedImpactUsd":1200}'))).toBe(1200);
  });

  it("readFindingProjectedImpactInterval returns null when neither bound is present", () => {
    expect(readFindingProjectedImpactInterval(buildFinding("f1", "{}"))).toBeNull();
    expect(
      readFindingProjectedImpactInterval(buildFinding("f2", '{"payload":{"confidenceReasoning":"why"}}')),
    ).toBeNull();
  });

  it("readFindingProjectedImpactInterval reads bounds and reasoning", () => {
    const interval = readFindingProjectedImpactInterval(
      buildFinding(
        "f1",
        '{"payload":{"projectedImpactUsdLowerBound":100,"projectedImpactUsdUpperBound":900,"confidenceReasoning":"sampled"}}',
      ),
    );

    expect(interval).toEqual({ lower: 100, upper: 900, reasoning: "sampled" });
  });

  it("hasFindingsWhatIfAnalysisContent is false without a baseline or projected savings", () => {
    expect(hasFindingsWhatIfAnalysisContent([], null)).toBe(false);
    expect(hasFindingsWhatIfAnalysisContent([buildFinding("f1", "{}")], null)).toBe(false);
    expect(hasFindingsWhatIfAnalysisContent([buildFinding("f1", '{"projectedImpactUsd":0}')], null)).toBe(false);
  });

  it("omits missing projected impact from savings totals (P-01)", () => {
    const findings = [
      buildFinding("f-with", '{"projectedImpactUsd":500}'),
      buildFinding("f-missing", "{}"),
    ];

    const total = findings.reduce((sum, finding) => {
      const impact = readFindingProjectedImpactUsd(finding);

      return impact !== null && impact > 0 ? sum + impact : sum;
    }, 0);

    expect(total).toBe(500);
    expect(readFindingProjectedImpactUsd(findings[1]!)).toBeNull();
  });

  it("hasFindingsWhatIfAnalysisContent is true with a baseline or projected savings", () => {
    expect(hasFindingsWhatIfAnalysisContent([], 10000)).toBe(true);
    expect(hasFindingsWhatIfAnalysisContent([buildFinding("f1", '{"projectedImpactUsd":1200}')], null)).toBe(true);
  });

  it("rollupWhatIfSelectedProjectedSavingsUsd does not treat omitted impact as zero", () => {
    const selected = new Set(["f1", "f2"]);

    expect(
      rollupWhatIfSelectedProjectedSavingsUsd(
        [
          { findingId: "f1", savingsUsd: 100 },
          { findingId: "f2", savingsUsd: null },
        ],
        selected,
        true,
      ),
    ).toEqual({ totalUsd: null, incomplete: true });

    expect(
      rollupWhatIfSelectedProjectedSavingsUsd(
        [
          { findingId: "f1", savingsUsd: 100 },
          { findingId: "f2", savingsUsd: 50 },
        ],
        selected,
        true,
      ),
    ).toEqual({ totalUsd: 150, incomplete: false });
  });
});
