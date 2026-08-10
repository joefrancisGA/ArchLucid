import { describe, expect, it } from "vitest";

import { contextualizeReviewPackagePrimaryActionForActiveTab } from "./contextualize-review-package-primary-action";

const baseInput = {
  runId: "run-abc",
  manifestId: "manifest-1" as string | null,
  hasCommitBlockingFailures: false,
  blockingFindingCount: 2,
  buyerPolishedArtifactTable: true,
  operatorGovernanceDecision: null as string | null,
  manifestStatus: "Draft" as string | null,
  runCompleted: true,
  commitBlockedReason: null as string | null,
};

describe("contextualizeReviewPackagePrimaryActionForActiveTab", () => {
  it("relabels review-findings on the findings tab to an in-page disposition CTA", () => {
    const action = contextualizeReviewPackagePrimaryActionForActiveTab(
      {
        kind: "review-findings",
        label: "Review findings",
        href: "/architecture/reviews/run-abc?reviewTab=findings",
      },
      "findings",
      baseInput,
    );

    expect(action.label).toBe("Disposition blocking findings");
    expect(action.href).toContain("#run-detail-findings-workspace");
  });

  it("routes incomplete assessment blockers to re-run review", () => {
    const action = contextualizeReviewPackagePrimaryActionForActiveTab(
      {
        kind: "review-findings",
        label: "Review findings",
        href: "/architecture/reviews/run-abc?reviewTab=findings",
      },
      "findings",
      {
        ...baseInput,
        blockingFindingCount: 0,
        commitBlockedReason:
          "Assessment coverage is incomplete for architecture structure, cost, compliance, and quality review. Re-run the review before finalizing.",
      },
    );

    expect(action.label).toBe("Re-run review");
    expect(action.href).toContain("rerun=run-abc");
  });

  it("leaves actions unchanged on other tabs", () => {
    const original = {
      kind: "review-findings" as const,
      label: "Review findings",
      href: "/architecture/reviews/run-abc?reviewTab=findings",
    };

    expect(
      contextualizeReviewPackagePrimaryActionForActiveTab(original, "overview", baseInput),
    ).toEqual(original);
  });
});
