import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdvisoryScansTriageFirstPendingStrip } from "./AdvisoryScansTriageFirstPendingStrip";

describe("AdvisoryScansTriageFirstPendingStrip", () => {
  it("calls review recommendation handler", () => {
    const onReviewRecommendation = vi.fn();

    render(
      <AdvisoryScansTriageFirstPendingStrip
        target={{
          recommendationId: "rec-1",
          title: "Harden API gateway",
          runId: "run-1",
          createdUtc: "2026-01-01T00:00:00Z",
        }}
        onReviewRecommendation={onReviewRecommendation}
      />,
    );

    fireEvent.click(screen.getByTestId("advisory-scans-triage-first-pending-review"));
    expect(onReviewRecommendation).toHaveBeenCalledWith("rec-1");
  });
});
