import { describe, expect, it } from "vitest";

import {
  governanceFindingDetailKeyboardActivate,
  governanceFindingQueuePrimaryInspectHref,
  governanceFindingQueueRowNeedsDispositionRecording,
  governanceFindingQueueRowReviewHrefForRow,
  navigateGovernanceFindingDetail,
} from "@/components/governance/findings/governance-findings-navigation";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

function queueRow(overrides: Partial<GovernanceFindingQueueRow>): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Run 1",
    manifestId: "",
    findingId: "finding-1",
    title: "Exposure path",
    severity: "High",
    category: "Storage",
    status: "Open",
    recommended: "Fix",
    recordKind: "finding",
    ...overrides,
  };
}

describe("governanceFindingQueuePrimaryInspectHref", () => {
  it("routes open decision-grade rows to the findings workspace deep link", () => {
    const row = queueRow({
      classification: "DecisionGradeFinding",
      latestDisposition: null,
    });

    expect(governanceFindingQueueRowNeedsDispositionRecording(row)).toBe(true);
    expect(governanceFindingQueuePrimaryInspectHref(row)).toBe(
      "/architecture/reviews/run-1?reviewTab=findings&findingId=finding-1#run-detail-first-review-spine-findings",
    );
  });

  it("keeps evidence-trace inspect when disposition is already recorded", () => {
    const row = queueRow({
      classification: "DecisionGradeFinding",
      latestDisposition: "Accepted",
    });

    expect(governanceFindingQueueRowNeedsDispositionRecording(row)).toBe(false);
    expect(governanceFindingQueuePrimaryInspectHref(row)).toBe(
      "/architecture/reviews/run-1/findings/finding-1/evidence-trace",
    );
  });

  it("routes the review column to findings workspace when disposition is open", () => {
    const row = queueRow({
      classification: "DecisionGradeFinding",
      latestDisposition: null,
    });

    expect(governanceFindingQueueRowReviewHrefForRow(row)).toBe(
      "/architecture/reviews/run-1?reviewTab=findings&findingId=finding-1#run-detail-first-review-spine-findings",
    );
  });
});

describe("navigateGovernanceFindingDetail row overload", () => {
  it("uses primary inspect href for open decision-grade rows", () => {
    const row = queueRow({
      classification: "DecisionGradeFinding",
      latestDisposition: null,
    });
    const pushed: string[] = [];
    const router = { push: (href: string) => pushed.push(href) };

    navigateGovernanceFindingDetail(router as never, row);

    expect(pushed).toEqual([governanceFindingQueuePrimaryInspectHref(row)]);
  });

  it("keyboard activate on row pushes primary inspect href", () => {
    const row = queueRow({
      classification: "DecisionGradeFinding",
      latestDisposition: null,
    });
    const pushed: string[] = [];
    const router = { push: (href: string) => pushed.push(href) };

    governanceFindingDetailKeyboardActivate(
      { key: "Enter", preventDefault: () => undefined } as never,
      router as never,
      row,
    );

    expect(pushed).toEqual([governanceFindingQueuePrimaryInspectHref(row)]);
  });
});
