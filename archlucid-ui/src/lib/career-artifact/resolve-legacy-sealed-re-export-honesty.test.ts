import { describe, expect, it } from "vitest";

import { resolveLegacySealedReExportHonesty } from "@/lib/career-artifact/resolve-legacy-sealed-re-export-honesty";

describe("resolveLegacySealedReExportHonesty (FC-75)", () => {
  it("returns true for committed manifests with incomplete transparency trail", () => {
    expect(
      resolveLegacySealedReExportHonesty({
        manifestId: "00000000-0000-0000-0000-000000000101",
        status: "Committed",
        ruleSetId: "pack",
        ruleSetVersion: "1",
        manifestHash: "hash",
        decisionCount: 1,
        warningCount: 0,
        unresolvedIssueCount: 0,
        feasibilityVerdict: {
          kind: "Feasible",
          summary: "ok",
          transparencyTrail: null,
        },
      } as never),
    ).toBe(true);
  });

  it("returns false when transparency trail is complete", () => {
    expect(
      resolveLegacySealedReExportHonesty({
        manifestId: "00000000-0000-0000-0000-000000000101",
        status: "Committed",
        ruleSetId: "pack",
        ruleSetVersion: "1",
        manifestHash: "hash",
        decisionCount: 1,
        warningCount: 0,
        unresolvedIssueCount: 0,
        feasibilityVerdict: {
          kind: "Feasible",
          summary: "ok",
          transparencyTrail: { asserted: [], inferred: [], skipped: [] },
        },
      } as never),
    ).toBe(false);
  });
});
