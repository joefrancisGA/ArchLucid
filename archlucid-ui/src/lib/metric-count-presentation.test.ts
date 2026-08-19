import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  assertReviewFindingsGovernanceParity,
  buildGovernanceFindingsQueueHref,
  countGovernanceRowsMatchingFilter,
  formatMetricCountHeadline,
  formatMetricCountScopeLabel,
  reviewFindingsGovernanceQueuePresentation,
  workspaceOpenFindingsPresentation,
} from "@/lib/metric-count-presentation";

function sampleRow(
  overrides: Partial<GovernanceFindingQueueRow> & Pick<GovernanceFindingQueueRow, "findingId">,
): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Run 1",
    manifestId: "manifest-1",
    title: "Sample",
    severity: "High",
    category: "Security",
    status: "Open",
    recommended: "Remediate",
    recordKind: "finding",
    ...overrides,
  };
}

describe("metric-count-presentation", () => {
  it("formats inline scope labels for workspace open findings", () => {
    const presentation = workspaceOpenFindingsPresentation(12);

    expect(formatMetricCountScopeLabel(presentation.dimensions)).toBe("workspace · open");
    expect(formatMetricCountHeadline(presentation)).toBe("12 open findings · workspace · open");
    expect(presentation.href).toBe("/governance/findings?filter=open");
  });

  it("builds governance queue hrefs with run scope and filter", () => {
    expect(buildGovernanceFindingsQueueHref({ runId: "run-abc", filter: "all" })).toBe(
      "/governance/findings?runId=run-abc",
    );
    expect(reviewFindingsGovernanceQueuePresentation("run-abc", 3).href).toBe(
      "/governance/findings?runId=run-abc",
    );
  });

  it("counts governance rows for the same filter contract as the queue UI", () => {
    const rows = [
      sampleRow({ findingId: "f-1", status: "Open" }),
      sampleRow({ findingId: "f-2", status: "Closed", recordKind: "decision" }),
      sampleRow({ findingId: "f-3", runId: "run-2", status: "Open" }),
    ];

    expect(countGovernanceRowsMatchingFilter(rows, "open", "run-1")).toBe(1);
  });

  it("asserts review-detail finding parity against governance finding rows only", () => {
    const rows = [
      sampleRow({ findingId: "f-1" }),
      sampleRow({ findingId: "f-2" }),
      sampleRow({ findingId: "d-1", recordKind: "decision" }),
    ];

    const parity = assertReviewFindingsGovernanceParity({
      reviewFindingCount: 2,
      rows,
      runId: "run-1",
    });

    expect(parity.matches).toBe(true);
    expect(parity.governanceFindingCount).toBe(2);
  });

  it("fails parity when governance queue includes extra finding rows for the review", () => {
    const rows = [
      sampleRow({ findingId: "f-1" }),
      sampleRow({ findingId: "f-2" }),
      sampleRow({ findingId: "f-3" }),
    ];

    const parity = assertReviewFindingsGovernanceParity({
      reviewFindingCount: 2,
      rows,
      runId: "run-1",
    });

    expect(parity.matches).toBe(false);
  });
});
