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
        openGateNavigationInput={{
          findings: [],
          hasFindingsSnapshot: true,
          reviewHasGoldenManifest: false,
        }}
      />,
    );

    expect(screen.getByTestId("review-open-gate")).toHaveTextContent("Uncommitted review");
    expect(screen.getByRole("link", { name: "Open the gate" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc?reviewTab=review-package#run-detail-first-review-spine-review-package",
    );
  });

  it("shows no open gate when the summary is clear", () => {
    render(<RunDetailFirstReviewSpineBand runId="run-abc" summary={baseSummary({})} />);

    expect(screen.getByTestId("review-open-gate")).toHaveTextContent(
      "No uncited finding or open decision-grade disposition is stored, and a committed package is stored. This is not an approval to build.",
    );
  });

  it("does not call the gate clear when evidence reference count was not stored", () => {
    render(
      <RunDetailFirstReviewSpineBand
        runId="run-abc"
        summary={baseSummary({ evidenceReferenceCountNotStored: true, openGateLabel: null })}
      />,
    );

    expect(screen.getByTestId("review-open-gate")).toHaveTextContent(
      "Evidence reference count was not stored. This spine does not call the gate clear.",
    );
  });

  it("links the top finding row into the findings workspace", () => {
    render(
      <RunDetailFirstReviewSpineBand
        runId="run-abc"
        summary={baseSummary({
          showTopFindingRow: true,
          topFindingId: "top-1",
          topFindingTitle: "Public storage exposure",
          topFindingRankLabel: "Highest stored severity:",
          topFindingSeverityLabel: "High",
        })}
        openGateNavigationInput={{
          findings: [],
          hasFindingsSnapshot: true,
          reviewHasGoldenManifest: true,
        }}
      />,
    );

    expect(screen.getByTestId("run-detail-first-review-spine-top-finding-link")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc?reviewTab=findings&findingId=top-1#run-detail-first-review-spine-findings",
    );
  });

  it("withholds open gate links when review navigation input is missing", () => {
    render(
      <RunDetailFirstReviewSpineBand
        runId="run-abc"
        summary={baseSummary({
          openGateLabel: "Uncited finding",
          openGateReviewTab: "findings",
        })}
      />,
    );

    expect(screen.getByTestId("review-open-gate")).toHaveTextContent(
      "Open gate link withheld until review context is available.",
    );
    expect(screen.queryByRole("link", { name: "Open the gate" })).not.toBeInTheDocument();
  });
});
