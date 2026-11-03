import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailFirstReviewSpineBand } from "./RunDetailFirstReviewSpineBand";
import type { FirstReviewSpineBandSummary } from "@/lib/reviews/first-review-spine-band";

function baseSummary(overrides: Partial<FirstReviewSpineBandSummary>): FirstReviewSpineBandSummary {
  return {
    gateOutcomeLabel: "Feasible",
    gateOutcomeTone: "success",
    gateOutcomeDetail: null,
    executionModeLabel: "Simulator",
    decisionGradeCount: 1,
    checklistCount: 0,
    uncitedCount: 0,
    evidenceReferenceCountNotStored: false,
    topFindingTitle: null,
    topFindingRankLabel: null,
    topFindingSeverityLabel: null,
    semanticSupportLine: null,
    showLaneBHonesty: false,
    treatmentSummaryLine: null,
    recordedDispositionCount: 0,
    openDecisionGradeDispositionCount: 0,
    showDispositionNextAction: false,
    classificationCountsStored: true,
    dispositionCountsStored: true,
    showTopFindingRow: false,
    topFindingId: null,
    topFindingPolicyMapped: false,
    openGateLabel: null,
    openGateHref: null,
    openGateReviewTab: null,
    ...overrides,
  };
}

describe("RunDetailFirstReviewSpineBand", () => {
  it("links uncommitted review gates to the review-package tab", () => {
    render(
      <RunDetailFirstReviewSpineBand
        runId="run-abc"
        summary={baseSummary({
          openGateLabel: "Uncommitted review",
          openGateReviewTab: "review-package",
        })}
      />,
    );

    expect(screen.getByTestId("review-open-gate")).toHaveTextContent("Uncommitted review");
    expect(screen.getByRole("link", { name: "Open the gate" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc?reviewTab=review-package",
    );
  });

  it("shows no open gate when the summary is clear", () => {
    render(<RunDetailFirstReviewSpineBand runId="run-abc" summary={baseSummary({})} />);

    expect(screen.getByTestId("review-open-gate")).toHaveTextContent("No open gate on this review.");
  });
});
