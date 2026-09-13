import { describe, expect, it } from "vitest";

import {
  getFindingEvidenceInspectHref,
  getFindingEvidenceTraceHref,
  getFindingGovernanceDispositionHref,
  resolveFindingsQueueNavHref,
} from "@/lib/findings/finding-evidence-navigation";

describe("finding-evidence-navigation", () => {
  it("builds the canonical evidence-trace route for a finding", () => {
    expect(getFindingEvidenceTraceHref("run-1", "finding-9")).toBe(
      "/architecture/reviews/run-1/findings/finding-9/evidence-trace",
    );
  });

  it("builds the approval disposition deep link for evidence trace", () => {
    expect(getFindingGovernanceDispositionHref("run-1", "finding-9")).toBe(
      "/architecture/reviews/run-1/findings/finding-9/evidence-trace#governance-disposition-heading",
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

  it("SG-027: keeps governance queue when Working parent is unknown", () => {
    expect(
      resolveFindingsQueueNavHref({
        findingsQueueRunId: "run-abc",
        isWorkingMode: true,
      }),
    ).toBe("/governance/findings?runId=run-abc");
  });
});
