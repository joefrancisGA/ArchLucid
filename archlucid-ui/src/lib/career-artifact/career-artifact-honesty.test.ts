import { describe, expect, it } from "vitest";

import {
  evaluateCareerArtifactHonesty,
  type CareerArtifactHonestyInput,
} from "@/lib/career-artifact/career-artifact-honesty";

const baseExportInput: CareerArtifactHonestyInput = {
  artifactKind: "export",
  runId: "run-1",
  progressSummary: null,
  manifestSummary: null,
  graphSnapshot: null,
  enginesSucceeded: 35,
  workingDesk: true,
};

describe("evaluateCareerArtifactHonesty (FC-02 / ADR 0078)", () => {
  it("blocks export when transparency trail sections are incomplete", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      transparencyTrail: { asserted: [], inferred: undefined, skipped: [] } as never,
    });

    expect(verdict.canRender).toBe(false);
    expect(verdict.blockedReasons.join(" ")).toMatch(/inferred/i);
  });

  it("allows finalize when trail object exists with empty arrays", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      artifactKind: "finalize",
      transparencyTrail: { asserted: [], inferred: [], skipped: [] },
    });

    expect(verdict.canRender).toBe(true);
    expect(verdict.blockedReasons).toHaveLength(0);
  });

  it("blocks finalize when trail is null", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      artifactKind: "finalize",
      transparencyTrail: null,
    });

    expect(verdict.canRender).toBe(false);
    expect(verdict.blockedReasons[0]).toMatch(/transparency trail/i);
  });

  it("blocks when measurement floor is unknown (null engines)", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      enginesSucceeded: null,
    });

    expect(verdict.canRender).toBe(false);
    expect(verdict.blockedReasons.join(" ")).toMatch(/not been measured/i);
  });

  it("blocks external sponsor distribution for curated sample runs", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      curatedSampleRun: true,
      blockExternalSponsorDistribution: true,
      transparencyTrail: { asserted: [], inferred: [], skipped: [] },
    });

    expect(verdict.canRender).toBe(false);
    expect(verdict.blockedReasons.join(" ")).toMatch(/demo or sample/i);
  });

  it("warns on legacy sealed re-export with incomplete trail instead of blocking export", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      legacySealedReExport: true,
      transparencyTrail: null,
    });

    expect(verdict.canRender).toBe(true);
    expect(verdict.warnings.join(" ")).toMatch(/sealed record/i);
  });

  it("includes skipped must keys in headerLines for export", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      manifestSummary: {
        manifestId: "m-1",
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
          transparencyTrail: {
            asserted: [],
            inferred: [],
            skipped: [{ questionKey: "drRpo", tier: "Must" }],
          },
        },
      } as never,
      transparencyTrail: {
        asserted: [],
        inferred: [],
        skipped: [{ questionKey: "drRpo", tier: "Must" }],
      },
    });

    expect(verdict.canRender).toBe(false);
    expect(verdict.headerLines.join(" ")).toMatch(/Skipped required questions: drRpo/i);
  });
});
