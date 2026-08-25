import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertRulesContinueLastViewedRow } from "./AlertRulesContinueLastViewedRow";

describe("AlertRulesContinueLastViewedRow", () => {
  it("renders continue row for last viewed rule", () => {
    render(
      <AlertRulesContinueLastViewedRow
        target={{ ruleId: "rule-1", name: "Cost increase" }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("alert-rules-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Cost increase")).toBeInTheDocument();
  });
});
