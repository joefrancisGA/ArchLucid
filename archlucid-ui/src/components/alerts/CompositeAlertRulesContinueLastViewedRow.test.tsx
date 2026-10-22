import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompositeAlertRulesContinueLastViewedRow } from "./CompositeAlertRulesContinueLastViewedRow";

describe("CompositeAlertRulesContinueLastViewedRow", () => {
  it("renders continue row for last viewed composite rule", () => {
    render(
      <CompositeAlertRulesContinueLastViewedRow
        target={{ ruleId: "composite-1", name: "Cost + compliance" }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("composite-alert-rules-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("composite-alert-rules-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Cost + compliance")).toBeInTheDocument();
  });
});
