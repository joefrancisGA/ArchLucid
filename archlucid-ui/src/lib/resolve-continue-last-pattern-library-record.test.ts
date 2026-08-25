import { describe, expect, it } from "vitest";

import { resolveContinueLastPatternLibraryRecord } from "@/lib/resolve-continue-last-pattern-library-record";
import type { PatternLibraryRecord } from "@/lib/pattern-library-types";

function record(patternKey: string): PatternLibraryRecord {
  return {
    patternKey,
    name: `Pattern ${patternKey}`,
    description: "desc",
    domains: ["Security"],
    platforms: ["Azure"],
    patternType: "Reference architecture",
    adoption: "Emerging",
    risk: "Medium",
    governance: "Policy-backed",
    relatedControls: [],
    relatedPolicyPacks: [],
    reviewCountLabel: "3 reviews",
    tenantCountLabel: "1 tenant",
    overview: "overview",
    whereAppears: "where",
    typicalRisks: [],
    requiredEvidence: [],
    governanceConsiderations: [],
    relatedPolicyRules: [],
    peerPatternKeys: [],
    detailHref: `/insights/patterns/${patternKey}`,
  };
}

describe("resolveContinueLastPatternLibraryRecord", () => {
  it("returns the first record when no recent view exists", () => {
    const match = resolveContinueLastPatternLibraryRecord([
      record("pattern-a"),
      record("pattern-b"),
    ]);

    expect(match?.patternKey).toBe("pattern-a");
  });
});
