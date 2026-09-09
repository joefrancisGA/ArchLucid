import { describe, expect, it } from "vitest";

import {
  evaluateCareerArtifactHonesty,
  type CareerArtifactHonestyInput,
} from "@/lib/career-artifact/career-artifact-honesty";
import { SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON } from "@/lib/governance/simulator-career-honesty";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

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
      workingDesk: true,
    });

    expect(verdict.canRender).toBe(true);
    expect(verdict.blockedReasons).toHaveLength(0);
    expect(verdict.warnings.join(" ")).toMatch(/no asserted intake recorded/i);
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

  it("blocks Working sample exports instead of warning only (FC-74)", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      isSample: true,
      transparencyTrail: { asserted: [{ key: "businessOutcome", value: "Reduce triage time" }], inferred: [], skipped: [] },
    });

    expect(verdict.canRender).toBe(false);
    expect(verdict.blockedReasons.join(" ")).toMatch(/sample workspace/i);
  });

  it("warns on legacy sealed re-export with incomplete trail instead of blocking export", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      enginesSucceeded: 41,
      legacySealedReExport: true,
      transparencyTrail: null,
    });

    expect(verdict.canRender).toBe(true);
    expect(verdict.warnings.join(" ")).toMatch(/sealed record/i);
  });

  it("blocks Working export when asserted trail is empty", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      transparencyTrail: { asserted: [], inferred: [], skipped: [] },
    });

    expect(verdict.canRender).toBe(false);
    expect(verdict.blockedReasons.join(" ")).toMatch(/no asserted intake recorded/i);
  });

  it("blocks Working export when pre-finalize gate is disabled (LP-18)", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      preCommitGateEnabled: false,
      transparencyTrail: {
        asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
        inferred: [],
        skipped: [],
      },
    });

    expect(verdict.canRender).toBe(false);
    expect(verdict.blockedReasons.join(" ")).toMatch(/not a fully governed review record/i);
  });

  it("blocks Working export when decision-grade provenance is missing", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      transparencyTrail: { asserted: [{ key: "businessOutcome", value: "Reduce triage time" }], inferred: [], skipped: [] },
      findingsSnapshot: {
        findings: [
          {
            findingId: "finding-1",
            findingType: "PolicyViolation",
            classification: "DecisionGradeFinding",
          },
        ],
      },
    });

    expect(verdict.canRender).toBe(false);
    expect(verdict.blockedReasons.join(" ")).toMatch(/typed-engine provenance/i);
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
            asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
            inferred: [],
            skipped: [{ questionKey: "drRpo", tier: "Must" }],
          },
        },
      } as never,
      transparencyTrail: {
        asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
        inferred: [],
        skipped: [{ questionKey: "drRpo", tier: "Must" }],
      },
    });

    expect(verdict.canRender).toBe(false);
    expect(verdict.headerLines.join(" ")).toMatch(/Skipped required questions: drRpo/i);
  });

  it("blocks Working simulator export without rehearsal banner on artifact (LP-06)", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      transparencyTrail: {
        asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
        inferred: [],
        skipped: [],
      },
    });

    expect(verdict.canRender).toBe(false);
    expect(verdict.blockedReasons).toContain(SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON);
  });

  it("allows Working simulator export when rehearsal banner is on the artifact (LP-06)", () => {
    const verdict = evaluateCareerArtifactHonesty({
      ...baseExportInput,
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      simulatorRehearsalBannerOnArtifact: true,
      transparencyTrail: {
        asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
        inferred: [],
        skipped: [],
      },
    });

    expect(verdict.blockedReasons).not.toContain(SIMULATOR_REHEARSAL_CAREER_BLOCK_REASON);
    expect(verdict.headerLines.join(" ")).toMatch(/rule-based analysis/i);
  });
});
