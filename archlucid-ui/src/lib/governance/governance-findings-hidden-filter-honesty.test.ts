import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { FINDING_CLASSIFICATION_CHECKLIST_COVERAGE, FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";
import { deriveGovernanceFindingsHiddenFilterHonesty } from "@/lib/governance/governance-findings-hidden-filter-honesty";

function row(partial: Partial<GovernanceFindingQueueRow> & Pick<GovernanceFindingQueueRow, "findingId">): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Payments review",
    manifestId: "manifest-1",
    title: partial.title ?? partial.findingId,
    severity: "High",
    category: "Security",
    status: "Open",
    recommended: "Fix",
    recordKind: "finding",
    ...partial,
  };
}

describe("governance-findings-hidden-filter-honesty (CA-40)", () => {
  it("CA-40: filter hides 3 findings → copy includes 3", () => {
    const scopedRows = [
      row({ findingId: "f-1", classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE, insightDensityScore: 10 }),
      row({ findingId: "f-2", classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE, insightDensityScore: 10 }),
      row({ findingId: "f-3", classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE, insightDensityScore: 10 }),
      row({ findingId: "f-4", classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE, insightDensityScore: 10 }),
    ];
    const displayedRows = [
      row({ findingId: "f-1", classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE, insightDensityScore: 10 }),
    ];

    const result = deriveGovernanceFindingsHiddenFilterHonesty(scopedRows, displayedRows);

    expect(result.hiddenCount).toBe(3);
    expect(result.line).toBe("3 findings hidden by filters");
    expect(result.hasHidden).toBe(true);
  });

  it("uses stronger copy when a hidden decision-grade row exists", () => {
    const scopedRows = [
      row({ findingId: "f-1", classification: FINDING_CLASSIFICATION_DECISION_GRADE }),
      row({ findingId: "f-2", classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE, insightDensityScore: 10 }),
    ];
    const displayedRows = [
      row({ findingId: "f-2", classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE, insightDensityScore: 10 }),
    ];

    const result = deriveGovernanceFindingsHiddenFilterHonesty(scopedRows, displayedRows);

    expect(result.line).toContain("1 finding hidden by filters");
    expect(result.line).toContain("decision-grade row is hidden");
  });
});
