import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from ".././quick-decision-summary-derive";

import {
  hasFindingsWhatIfAnalysisContent,
  readFindingProjectedImpactInterval,
  readFindingProjectedImpactUsd,
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
  it("readFindingProjectedImpactUsd returns 0 for unparsable or absent impact", () => {
    expect(readFindingProjectedImpactUsd(buildFinding("f1", "not json"))).toBe(0);
    expect(readFindingProjectedImpactUsd(buildFinding("f2", "{}"))).toBe(0);
    expect(readFindingProjectedImpactUsd(buildFinding("f3", '{"projectedImpactUsd":"1200"}'))).toBe(0);
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

  it("hasFindingsWhatIfAnalysisContent is true with a baseline or projected savings", () => {
    expect(hasFindingsWhatIfAnalysisContent([], 10000)).toBe(true);
    expect(hasFindingsWhatIfAnalysisContent([buildFinding("f1", '{"projectedImpactUsd":1200}')], null)).toBe(true);
  });
});
