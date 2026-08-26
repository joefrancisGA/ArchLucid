import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ROI_SUMMARY_FOLLOW_UPS_TITLE } from "@/lib/roi-summary-evidence-copy";
import { RoiSummaryClaimOrientationStrip } from "./RoiSummaryClaimOrientationStrip";

describe("RoiSummaryClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<RoiSummaryClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("roi-summary-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ROI_SUMMARY_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});
