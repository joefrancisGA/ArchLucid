import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RiskExceptionsClaimOrientationStrip } from "./RiskExceptionsClaimOrientationStrip";
import {
  RISK_EXCEPTIONS_CANONICAL_PATH,
  RISK_EXCEPTIONS_FOLLOW_UPS_TITLE,
} from "@/lib/risk-exceptions-evidence-copy";

describe("RiskExceptionsClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<RiskExceptionsClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: RISK_EXCEPTIONS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("risk-exceptions-sources")).toBeInTheDocument();
  });

  it("does not link back to the exceptions route", () => {
    render(<RiskExceptionsClaimOrientationStrip />);

    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toBe(RISK_EXCEPTIONS_CANONICAL_PATH);
    }
  });
});
