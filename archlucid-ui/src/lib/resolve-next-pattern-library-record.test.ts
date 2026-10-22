import { describe, expect, it } from "vitest";

import type { PatternLibraryRecord } from "@/lib/pattern-library-types";
import { resolveNextPatternLibraryRecord } from "@/lib/resolve-next-pattern-library-record";

function record(patternKey: string, name: string): PatternLibraryRecord {
  return {
    patternKey,
    name,
    description: "desc",
    domains: ["SaaS"],
    platforms: ["Azure"],
    patternType: "Connectivity",
    adoption: "Common",
    risk: "Low",
    governance: "Usually approved",
    relatedControls: [],
    relatedPolicyPacks: [],
    reviewCountLabel: "1–5 reviews",
    tenantCountLabel: "1 tenant",
    overview: "overview",
    whereAppears: "where",
    typicalRisks: [],
    requiredEvidence: [],
    governanceConsiderations: [],
    relatedPolicyRules: [],
    alternatives: [],
    architectureShape: "shape",
    reviewQuestions: [],
  };
}

describe("resolveNextPatternLibraryRecord", () => {
  it("returns the next catalog pattern", () => {
    const next = resolveNextPatternLibraryRecord(
      [record("pattern-a", "Pattern A"), record("pattern-b", "Pattern B")],
      "pattern-a",
    );

    expect(next?.patternKey).toBe("pattern-b");
    expect(next?.href).toBe("/insights/patterns/pattern-b");
  });
});
