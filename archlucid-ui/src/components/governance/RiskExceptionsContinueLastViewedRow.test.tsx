import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RiskExceptionsContinueLastViewedRow } from "./RiskExceptionsContinueLastViewedRow";

describe("RiskExceptionsContinueLastViewedRow", () => {
  it("renders continue row with finding link", () => {
    render(
      <RiskExceptionsContinueLastViewedRow
        target={{
          riskExceptionId: "exc-1",
          findingId: "finding-1",
          rationale: "Accepted residual risk",
          href: "/architecture/reviews/run-1/findings/finding-1",
        }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("risk-exceptions-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("risk-exceptions-continue-last-viewed-open")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/finding-1",
    );
  });
});
