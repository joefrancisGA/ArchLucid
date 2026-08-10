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
    expect(action.href).toBe("/architecture/reviews/run-abc?reviewTab=findings");
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
    expect(action.href).toBe("/governance/approval-queue?runId=run-abc");
  });

  it("defaults finalized packages to send-to-sponsor when no blockers remain", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      manifestId: "manifest-1",
      runCompleted: true,
      manifestStatus: "Passed",
      operatorGovernanceDecision: "Approved",
    });

    expect(action.kind).toBe("send-to-sponsor");
    expect(action.label).toBe("Send to sponsor");
    expect(action.href).toBe(
      "/architecture/reviews/run-abc?reviewTab=review-package#sponsor-handoff",
    );
  });

  it("guides in-progress reviews toward evidence capture before completion", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      runCompleted: false,
    });

    expect(action.kind).toBe("add-evidence");
    expect(action.href).toBe("/architecture/reviews/run-abc?reviewTab=evidence");
  });

  it("surfaces finalize package when the run completed but has no manifest yet", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      runCompleted: true,
    });

    expect(action.kind).toBe("finalize-package");
    expect(action.href).toBeNull();
  });

  it("aligns the primary CTA label with the decision snapshot next action", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      manifestId: "manifest-1",
      runCompleted: true,
      blockingFindingCount: 1,
      nextAction:
        "Review findings — 1 unresolved finding currently blocks approval or finalization.",
    });

    expect(action.kind).toBe("review-findings");
    expect(action.label).toBe("Review findings");
  });

  it("keeps governance CTA labels independent of next-action copy", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      manifestId: "manifest-1",
      runCompleted: true,
      manifestStatus: "Draft",
      nextAction: "Confirm evidence and remediation ownership for the open medium-severity finding",
    });

    expect(action.kind).toBe("open-governance-decision");
    expect(action.label).not.toContain("Confirm evidence");
  });

  it("falls back to Review findings when next-action copy is too long for a button", () => {
    const action = resolveReviewPackagePrimaryAction({
      ...baseInput,
      hasCommitBlockingFailures: true,
      nextAction: "Confirm evidence and remediation ownership for the open medium-severity finding",
    });

    expect(action.kind).toBe("review-findings");
    expect(action.label).toBe("Review findings");
  });
});
