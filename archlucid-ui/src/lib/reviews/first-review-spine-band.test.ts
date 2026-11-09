import { describe, expect, it } from "vitest";

import {
  resolveFirstReviewFindingsWorkspaceHref,
  resolveFirstReviewOpenGateReviewHref,
  resolveFirstReviewRecordDispositionHref,
} from "@/lib/reviews/first-review-spine-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";

const openDispositionFinding: QuickDecisionFinding = {
  findingId: "finding-open-1",
  title: "Uncited exposure",
  recommendation: null,
  severityValue: 4,
  findingOrder: 0,
  aiReasoning: {},
  isMuted: false,
  muteReason: null,
  enforcementTier: "blocking",
  classification: "DecisionGradeFinding",
  evidenceReferences: [],
  policyRuleId: null,
  recordedDisposition: null,
} as QuickDecisionFinding;

describe("first-review spine band deep links", () => {
  it("resolveFirstReviewOpenGateReviewHref uses nested Working review paths when architectureId is set", () => {
    const href = resolveFirstReviewOpenGateReviewHref({
      runId: "run-abc",
      findings: [],
      hasFindingsSnapshot: true,
      reviewHasGoldenManifest: false,
      architectureId: "architecture-identity-001",
    });

    expect(href).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-abc?reviewTab=review-package#run-detail-first-review-spine-review-package",
    );
  });

  it("resolveFirstReviewFindingsWorkspaceHref uses nested base for disposition follow-up", () => {
    const href = resolveFirstReviewFindingsWorkspaceHref({
      runId: "run-abc",
      findings: [openDispositionFinding],
      hasFindingsSnapshot: true,
      architectureId: "architecture-identity-001",
    });

    expect(href).toContain("reviewTab=findings");
    expect(href).toContain("findingId=finding-open-1");
    expect(href).toContain("workbenchFocus=findings");
  });

  it("resolveFirstReviewRecordDispositionHref targets open disposition finding", () => {
    const href = resolveFirstReviewRecordDispositionHref({
      runId: "run-abc",
      findings: [openDispositionFinding],
      hasFindingsSnapshot: true,
    });

    expect(href).toContain("findingId=finding-open-1");
    expect(href).toContain("workbenchFocus=findings");
  });

  it("resolveFirstReviewOpenGateReviewHref adds workbenchFocus=findings when the open gate targets findings", () => {
    const href = resolveFirstReviewOpenGateReviewHref({
      runId: "run-abc",
      findings: [
        {
          findingId: "uncited-1",
          severityValue: 3,
          evidenceRefCount: 0,
          hasRecordedDisposition: false,
        } as never,
      ],
      hasFindingsSnapshot: true,
      reviewHasGoldenManifest: true,
    });

    expect(href).toContain("reviewTab=findings");
    expect(href).toContain("findingId=uncited-1");
    expect(href).toContain("workbenchFocus=findings");
  });
});
