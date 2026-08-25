import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsInboxContinueLastViewedRow } from "./AlertsInboxContinueLastViewedRow";

describe("AlertsInboxContinueLastViewedRow", () => {
  it("renders continue row for last viewed alert", () => {
    render(
      <AlertsInboxContinueLastViewedRow
        target={{ alertId: "alert-1", title: "Cost spike" }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("alerts-inbox-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("alerts-inbox-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Cost spike")).toBeInTheDocument();
  });
});
