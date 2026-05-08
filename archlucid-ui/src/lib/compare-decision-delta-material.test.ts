import { describe, expect, it } from "vitest";

import type { DecisionDelta } from "@/types/comparison";

import { isMetadataOnlyDecisionDelta, partitionDecisionDeltas } from "./compare-decision-delta-material";

describe("compare-decision-delta-material", () => {
  it("classifies obvious bookkeeping keys as metadata-only", () => {
    const rows: DecisionDelta[] = [
      { decisionKey: "manifest.createdUtc", baseValue: "a", targetValue: "b", changeType: "Modified" },
      { decisionKey: "deploy-region", baseValue: "east", targetValue: "west", changeType: "Modified" },
      { decisionKey: "bundle.manifestHash", baseValue: "h1", targetValue: "h2", changeType: "Changed" },
    ];

    const { material, metadata } = partitionDecisionDeltas(rows);

    expect(metadata).toHaveLength(2);
    expect(material.map((m) => m.decisionKey)).toEqual(["deploy-region"]);
    expect(isMetadataOnlyDecisionDelta(rows[0]!)).toBe(true);
    expect(isMetadataOnlyDecisionDelta(rows[1]!)).toBe(false);
  });
});
