import { describe, expect, it } from "vitest";

import { resolveReviewPackagePrimaryAction } from "./resolve-review-package-primary-action";

const baseInput = {
  runId: "run-abc",
  manifestId: null as string | null,
  hasCommitBlockingFailures: false,
  blockingFindingCount: 0,
  buyerPolishedArtifactTable: false,
  operatorGovernanceDecision: null as string | null,
  manifestStatus: null as string | null,
  runCompleted: false,
};

describe("resolveReviewPackagePrimaryAction", () => {
  it("prioritizes review findings when commit-blocking coverage is open", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      hasCommitBlockingFailures: true,
      manifestId: "manifest-1",
      blockingFindingCount: 3,
    });

    expect(action.kind).toBe("review-findings");
    expect(action.href).toBe("#run-explanation");
  });

  it("surfaces blocking finding counts on finalized packages", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      manifestId: "manifest-1",
      runCompleted: true,
      blockingFindingCount: 2,
    });

    expect(action.kind).toBe("review-findings");
    expect(action.label).toBe("Review findings");
  });

  it("routes finalized operator packages to governance when approval is still pending", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      manifestId: "manifest-1",
      runCompleted: true,
      manifestStatus: "Draft",
    });

    expect(action.kind).toBe("open-governance-decision");
    expect(action.href).toBe("/governance?runId=run-abc");
  });

  it("defaults finalized packages to export proof packet when no blockers remain", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      manifestId: "manifest-1",
      runCompleted: true,
      manifestStatus: "Passed",
      operatorGovernanceDecision: "Approved",
    });

    expect(action.kind).toBe("export-proof-packet");
    expect(action.href).toBe("#artifacts-exports");
  });

  it("guides in-progress reviews toward evidence capture before completion", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      runCompleted: false,
    });

    expect(action.kind).toBe("add-evidence");
    expect(action.href).toBe("#capture-evidence");
  });

  it("surfaces finalize package when the run completed but has no manifest yet", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      runCompleted: true,
    });

    expect(action.kind).toBe("finalize-package");
    expect(action.href).toBeNull();
  });
});
