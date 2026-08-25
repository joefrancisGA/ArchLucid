import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertRoutingContinueLastViewedRow } from "./AlertRoutingContinueLastViewedRow";

describe("AlertRoutingContinueLastViewedRow", () => {
  it("renders continue row for last viewed routing subscription", () => {
    render(
      <AlertRoutingContinueLastViewedRow
        target={{ subscriptionId: "sub-1", name: "Ops email" }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("alert-routing-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("alert-routing-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Ops email")).toBeInTheDocument();
  });
});
