import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";

import { CompareContinueLastComparisonRow } from "./CompareContinueLastComparisonRow";

describe("CompareContinueLastComparisonRow", () => {
  it("renders resume link with comparison query params", () => {
    render(
      <CompareContinueLastComparisonRow
        pair={{ priorRunId: "run-prior", laterRunId: "run-later" }}
      />,
    );

    expect(screen.getByTestId("compare-continue-last-comparison-row")).toBeInTheDocument();
    expect(screen.getByTestId("compare-continue-last-comparison-open")).toHaveAttribute(
      "href",
      comparePageHrefAdaptive("run-prior", "run-later"),
    );
  });
});
