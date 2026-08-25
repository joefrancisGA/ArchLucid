import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  classifyGovernanceFindingJobView,
  classifyReviewFindingJobView,
  countReviewFindingsForJobView,
  filterGovernanceRowsForJobView,
  filterReviewFindingsForJobView,
  matchesReviewFindingJobView,
  resolveEffectiveFindingJobView,
} from "@/lib/findings/finding-job-view";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function reviewFinding(overrides: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">): QuickDecisionFinding {
  return {
    findingId: overrides.findingId,
    title: overrides.title ?? "Finding",
    recommendation: overrides.recommendation ?? "Fix it",
    severityValue: overrides.severityValue ?? 2,
    findingOrder: overrides.findingOrder ?? 0,
    aiReasoning: overrides.aiReasoning ?? { wireJson: "{}", reasoningTrace: "" },
    isMuted: overrides.isMuted ?? false,
    muteReason: overrides.muteReason ?? null,
    enforcementTier: overrides.enforcementTier ?? "PolicyViolation",
    humanReviewStatus: overrides.humanReviewStatus ?? 1,
    trustLabel: overrides.trustLabel,
    policyRuleId: overrides.policyRuleId,
    evidenceRefCount: overrides.evidenceRefCount,
    confidenceLevel: overrides.confidenceLevel,
  };
}

function governanceRow(overrides: Partial<GovernanceFindingQueueRow> & Pick<GovernanceFindingQueueRow, "findingId">): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Review",
    manifestId: "manifest",
    findingId: overrides.findingId,
    title: overrides.title ?? "Finding",
    severity: overrides.severity ?? "High",
    category: overrides.category ?? "Security",
    status: overrides.status ?? "Open",
    recommended: overrides.recommended ?? "Fix",
    recordKind: overrides.recordKind ?? "finding",
    latestDisposition: overrides.latestDisposition,
    humanReviewStatusLabel: overrides.humanReviewStatusLabel,
  };
}

describe("finding-job-view", () => {
  it("defaults review pending findings to needs-my-decision", () => {
    const finding = reviewFinding({ findingId: "f-1", humanReviewStatus: 1 });

    expect(classifyReviewFindingJobView(finding)).toBe("needs-my-decision");
    expect(matchesReviewFindingJobView(finding, "needs-my-decision")).toBe(true);
  });

  it("maps deferred disposition to deferred job view", () => {
    const review = reviewFinding({
      findingId: "f-2",
      aiReasoning: { wireJson: JSON.stringify({ latestDisposition: "Deferred" }), reasoningTrace: "" },
    });
    const governance = governanceRow({ findingId: "g-1", latestDisposition: "Deferred" });

    expect(classifyReviewFindingJobView(review)).toBe("deferred");
    expect(classifyGovernanceFindingJobView(governance)).toBe("deferred");
  });

  it("maps cannot-determine findings to answer-these-questions", () => {
    const finding = reviewFinding({
      findingId: "f-cd",
      title: "Recovery objective cannot be verified",
      recommendation: "Insufficient evidence to confirm RTO",
      severityValue: 2,
      trustLabel: "Heuristic",
      evidenceRefCount: 0,
    });

    expect(classifyReviewFindingJobView(finding)).toBe("answer-these-questions");
  });

  it("does not treat approved cannot-determine findings as open questions", () => {
    const finding = reviewFinding({
      findingId: "f-approved-cd",
      title: "Recovery objective cannot be verified",
      recommendation: "Insufficient evidence to confirm RTO",
      severityValue: 2,
      humanReviewStatus: 2,
      trustLabel: "Heuristic",
      evidenceRefCount: 0,
    });

    expect(classifyReviewFindingJobView(finding)).toBe("needs-my-decision");
  });

  it("maps approved evidence-backed review findings to ready-for-sponsor-packet", () => {
    const finding = reviewFinding({
      findingId: "f-3",
      humanReviewStatus: 2,
      policyRuleId: "cost-constraint.budget",
    });

    expect(classifyReviewFindingJobView(finding)).toBe("ready-for-sponsor-packet");
  });

  it("keeps approved ungrounded review findings out of the sponsor-packet view", () => {
    const finding = reviewFinding({
      findingId: "f-ungrounded",
      humanReviewStatus: 2,
      trustLabel: "MissingCitation",
      evidenceRefCount: 0,
    });

    expect(classifyReviewFindingJobView(finding)).toBe("needs-my-decision");
  });

  it("does not classify disposition-accepted findings without sponsor trust as needs-my-decision", () => {
    const finding = reviewFinding({
      findingId: "f-accepted-ungrounded",
      humanReviewStatus: 1,
      trustLabel: "MissingCitation",
      evidenceRefCount: 0,
      aiReasoning: {
        wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
        reasoningTrace: "",
      },
    });

    expect(classifyReviewFindingJobView(finding)).toBe("disposition-closed");
    expect(matchesReviewFindingJobView(finding, "needs-my-decision")).toBe(false);
    expect(countReviewFindingsForJobView([finding], "needs-my-decision")).toBe(0);
  });

  it("maps needs-evidence governance rows to needs-governance", () => {
    const row = governanceRow({ findingId: "g-2", latestDisposition: "NeedsEvidence" });

    expect(classifyGovernanceFindingJobView(row)).toBe("needs-governance");
    expect(filterGovernanceRowsForJobView([row], "needs-governance")).toHaveLength(1);
    expect(filterGovernanceRowsForJobView([row], "needs-my-decision")).toHaveLength(0);
  });

  it("filters review findings without contradictory job membership", () => {
    const rows = [
      reviewFinding({ findingId: "f-4", humanReviewStatus: 1 }),
      reviewFinding({ findingId: "f-5", humanReviewStatus: 2, policyRuleId: "sec.baseline" }),
    ];

    const decisionQueue = filterReviewFindingsForJobView(rows, "needs-my-decision");
    const sponsorReady = filterReviewFindingsForJobView(rows, "ready-for-sponsor-packet");

    expect(decisionQueue.map((entry) => entry.findingId)).toEqual(["f-4"]);
    expect(sponsorReady.map((entry) => entry.findingId)).toEqual(["f-5"]);
  });

  it("maps governance adversarial phrasing to verify-hypotheses (TB-2315)", () => {
    const row = governanceRow({
      findingId: "g-adv",
      title: "Adversarial challenge: backup assumption",
      recommended: "Falsify/confirm with evidence before publish",
    });

    expect(classifyGovernanceFindingJobView(row)).toBe("verify-hypotheses");
  });

  it("maps architecture intelligence adversarial lane findings to verify-hypotheses", () => {
    const finding = reviewFinding({
      findingId: "f-hypothesis",
      title: "Challenge finding: backup assumption",
      recommendation: "Falsify/confirm with: recovery tier inventory",
      severityValue: 1,
      aiReasoning: {
        wireJson: JSON.stringify({
          properties: {
            "architectureIntelligence.adversarialLane": "AdversarialChallenge",
          },
        }),
        reasoningTrace: "",
      },
    });

    expect(classifyReviewFindingJobView(finding)).toBe("verify-hypotheses");
  });

  it("detects finding merge conflict rows for resolve-contradictions lane", () => {
    const finding = reviewFinding({
      findingId: "f-merge-conflict",
      policyRuleId: "finding-merge-conflict",
      title: "Finding merge conflict requires operator resolution",
      recommendation: "Finding merge conflict on ADR 0063 key.",
      severityValue: 2,
      aiReasoning: {
        wireJson: JSON.stringify({ properties: { "findingMerge.conflict": "True" } }),
        reasoningTrace: "",
      },
    });

    expect(classifyReviewFindingJobView(finding)).toBe("resolve-contradictions");
  });

  it("resolveEffectiveFindingJobView skips persisted job view when the filter bar is hidden", () => {
    expect(resolveEffectiveFindingJobView("ready-for-sponsor-packet", true)).toBe("ready-for-sponsor-packet");
    expect(resolveEffectiveFindingJobView("ready-for-sponsor-packet", false)).toBeNull();
  });
});
