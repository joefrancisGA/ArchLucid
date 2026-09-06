import { describe, expect, it } from "vitest";

import { resolveReviewPackageDoThisNext } from "./resolve-review-package-do-this-next";

const baseInput = {
  runId: "run-abc",
  manifestId: null as string | null,
  hasCommitBlockingFailures: false,
  blockingFindingCount: 0,
  buyerPolishedArtifactTable: false,
  operatorGovernanceDecision: null as string | null,
  manifestStatus: null as string | null,
  runCompleted: false,
  showProgressTracker: false,
  openClarificationGapCount: 0,
  correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-abc",
  useCreateHomeWorkspaceTabs: true,
  evidenceCoverageLinkedCount: 0,
  evidenceCoverageTotalCount: 0,
  governanceDecisionRecorded: false,
};

describe("resolveReviewPackageDoThisNext", () => {
  it("routes pre-execute packages toward evidence capture", () => {
    const next = resolveReviewPackageDoThisNext(baseInput);

    expect(next.kind).toBe("add-evidence");
    expect(next.sentence).toContain("Evidence is still thin");
    expect(next.href).toContain("reviewTab=evidence");
  });

  it("uses create-home activity tab href when assessment is in progress on create-home", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      showProgressTracker: true,
      useCreateHomeWorkspaceTabs: true,
    });

    expect(next.kind).toBe("view-assessment-progress");
    expect(next.href).toContain("reviewTab=activity");
  });

  it("surfaces assessment-in-progress guidance before other CTAs", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      showProgressTracker: true,
    });

    expect(next.kind).toBe("view-assessment-progress");
    expect(next.actionLabel).toBe("View assessment progress");
    expect(next.href).toContain("reviewTab=activity");
  });

  it("surfaces assessment-failure guidance with rerun primary and inline recovery details", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      showProgressTracker: true,
      legacyRunStatus: "Failed",
      pipelineDiagnosticContext: { legacyRunStatus: "Failed" },
      pipelineSummary: {
        hasContextSnapshot: false,
        hasGraphSnapshot: false,
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
        description:
          'Architecture review intake for "ArchLucid".\n\nAttached files:\n- handbook.docx',
      },
    });

    expect(next.kind).toBe("rerun-review");
    expect(next.sentence).toContain("Execution failed");
    expect(next.sentence).toContain("re-run the review");
    expect(next.actionLabel).toBe("Re-run review");
    expect(next.href).toBe(baseInput.correctionHref);
    expect(next.secondaryAction?.label).toBe("Review submitted intake");
    expect(next.secondaryAction?.href).toContain("reviewTab=overview");
    expect(next.failureRecovery?.headline).toContain("Execution failed");
    expect(next.failureRecovery?.recoverySteps.join(" ")).toContain("administrator handoff");
    expect(next.failureRecovery?.recoverySteps.join(" ")).not.toContain("Confirm intake fields");
    expect(next.failureRecovery?.adminHandoff?.markdown).toContain("run-abc");
    expect(next.failureRecovery?.submittedIntakeRecap?.attachedFiles).toEqual(["handbook.docx"]);
    expect(next.sentence).not.toContain("running");
    expect(next.sentence).not.toContain("start a new review");
  });

  it("builds a rerun href when correctionHref is absent on terminal failure", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      correctionHref: null,
      showProgressTracker: true,
      legacyRunStatus: "Failed",
    });

    expect(next.kind).toBe("rerun-review");
    expect(next.href).toContain("rerun=run-abc");
    expect(next.href).toContain("path=guided-intake");
  });

  it("links assessment progress to reviewTab on committed review workspace", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      showProgressTracker: true,
      useCreateHomeWorkspaceTabs: false,
    });

    expect(next.href).toContain("reviewTab=activity");
  });

  it("prioritizes open clarifications on create-home packages", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      openClarificationGapCount: 2,
    });

    expect(next.kind).toBe("answer-clarifications");
    expect(next.sentence).toContain("2 clarifying questions");
    expect(next.sentence).toContain("before triaging findings");
    expect(next.href).toBe(baseInput.correctionHref);
  });

  it("routes to findings when clarifications are clear on create-home packages", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      openClarificationGapCount: 0,
      findingsCount: 2,
    });

    expect(next.kind).toBe("review-findings");
    expect(next.sentence).toContain("Clarifications are clear");
    expect(next.href).toContain("reviewTab=findings");
  });

  it("surfaces ready-to-finalize guidance when the run completed without a manifest", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      runCompleted: true,
    });

    expect(next.kind).toBe("finalize-package");
    expect(next.sentence).toContain("finalize");
    expect(next.href).toBeNull();
  });

  it("routes post-finalize blockers to findings review", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      manifestId: "manifest-1",
      runCompleted: true,
      blockingFindingCount: 1,
    });

    expect(next.kind).toBe("review-findings");
    expect(next.sentence).toContain("One finding still blocks");
  });

  it("defaults finalized packages to sponsor handoff when clear", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      manifestId: "manifest-1",
      runCompleted: true,
      manifestStatus: "Passed",
      operatorGovernanceDecision: "Approved",
      governanceDecisionRecorded: true,
    });

    expect(next.kind).toBe("send-to-sponsor");
    expect(next.sentence).toContain("finalized");
    expect(next.href).toContain("sponsor-handoff");
    expect(next.secondaryAction?.label).toBe("Start follow-up review");
    expect(next.quickLinks?.map((link) => link.label)).toEqual([
      "Invite reviewer",
      "Compare reviews",
      "Open sponsor briefing export",
    ]);
    expect(next.quickLinks?.find((link) => link.label === "Compare reviews")?.href).toBe(
      "/insights/compare-two-reviews?priorRunId=run-abc",
    );
  });

  it("demotes sponsor handoff when open findings lack linked evidence", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      manifestId: "manifest-1",
      runCompleted: true,
      manifestStatus: "Passed",
      operatorGovernanceDecision: "Approved",
      governanceDecisionRecorded: true,
      evidenceCoverageLinkedCount: 0,
      evidenceCoverageTotalCount: 4,
      useCreateHomeWorkspaceTabs: false,
    });

    expect(next.kind).toBe("send-to-sponsor");
    expect(next.sentence).toContain("none of its 4 open findings have linked evidence");
    expect(next.actionLabel).toBe("Review evidence coverage");
    expect(next.buttonVariant).toBe("outline");
    expect(next.href).toContain("reviewTab=evidence");
    expect(next.secondaryAction?.label).toBe("Send sponsor briefing export");
  });

  it("defaults a comparable second package to compare against the prior review", () => {
    const next = resolveReviewPackageDoThisNext({
      ...baseInput,
      manifestId: "manifest-1",
      runCompleted: true,
      manifestStatus: "Passed",
      operatorGovernanceDecision: "Approved",
      governanceDecisionRecorded: true,
      compareWithPriorHref: "/insights/compare-two-reviews?leftRunId=prior&rightRunId=run-abc",
    });

    expect(next.kind).toBe("compare-to-prior");
    expect(next.actionLabel).toBe("Compare reviews");
    expect(next.href).toContain("compare-two-reviews");
    expect(next.secondaryAction?.label).toBe("Send sponsor briefing export");
  });
});
