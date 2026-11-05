import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";

import {
  getFindingEvidenceInspectHref,
  getFindingEvidenceTraceHref,
  getFindingGovernanceDispositionHref,
  resolveFindingsQueueNavHref,
  resolveQuickDecisionFindingInspectHref,
  resolveQuickDecisionFindingDispositionHref,
} from "@/lib/findings/finding-evidence-navigation";

describe("finding-evidence-navigation", () => {
  it("builds the canonical evidence-trace route for a finding", () => {
    expect(getFindingEvidenceTraceHref("run-1", "finding-9")).toBe(
      "/architecture/reviews/run-1/findings/finding-9/evidence-trace",
    );
  });

  it("builds the findings workspace disposition deep link", () => {
    expect(getFindingGovernanceDispositionHref("run-1", "finding-9")).toBe(
      "/architecture/reviews/run-1?reviewTab=findings&findingId=finding-9#run-detail-first-review-spine-findings",
    );
  });

  it("aliases legacy inspect href helper to evidence-trace", () => {
    expect(getFindingEvidenceInspectHref("run-1", "finding-9")).toBe(
      "/architecture/reviews/run-1/findings/finding-9/evidence-trace",
    );
  });

  it("SG-027: returns nested architecture findings when Working parent is known", () => {
    expect(
      resolveFindingsQueueNavHref({
        findingsQueueRunId: "run-abc",
        architectureId: "arch-001",
        isWorkingMode: true,
      }),
    ).toBe("/architecture/architectures/arch-001/findings?runId=run-abc");
  });

  it("IP-005: quick-decision inspect uses nested focusedFinding when architecture is known", () => {
    expect(
      resolveQuickDecisionFindingInspectHref("run-1", "finding-9", {
        architectureId: "arch-001",
        isWorkingMode: true,
      }),
    ).toBe(`${architectureNestedFindingsPath("arch-001")}?runId=run-1&focusedFinding=finding-9`);
  });

  it("routes disposition CTAs to the findings workspace when not in nested working findings", () => {
    expect(resolveQuickDecisionFindingDispositionHref("run-1", "finding-9")).toBe(
      "/architecture/reviews/run-1?reviewTab=findings&findingId=finding-9#run-detail-first-review-spine-findings",
    );
  });

  it("SG-027: keeps governance queue when Working parent is unknown", () => {
    expect(
      resolveFindingsQueueNavHref({
        findingsQueueRunId: "run-abc",
        isWorkingMode: true,
      }),
    ).toBe("/governance/findings?runId=run-abc");
  });
});
