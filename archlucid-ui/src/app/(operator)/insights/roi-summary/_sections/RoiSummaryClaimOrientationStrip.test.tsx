import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ROI_SUMMARY_CLAIM_DISCIPLINE,
  ROI_SUMMARY_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/roi-summary-evidence-copy";

import { RoiSummaryClaimOrientationStrip } from "./RoiSummaryClaimOrientationStrip";

describe("RoiSummaryClaimOrientationStrip", () => {
  it("renders claim discipline heading and body", () => {
    render(<RoiSummaryClaimOrientationStrip />);

    expect(screen.getByRole("heading", { level: 2, name: ROI_SUMMARY_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("roi-summary-claim-discipline").textContent).toContain(
      ROI_SUMMARY_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("roi-summary-sources")).toBeInTheDocument();
  });
});
