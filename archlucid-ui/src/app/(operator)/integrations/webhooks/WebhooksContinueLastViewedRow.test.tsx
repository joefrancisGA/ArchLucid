import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WebhooksContinueLastViewedRow } from "./WebhooksContinueLastViewedRow";

describe("WebhooksContinueLastViewedRow", () => {
  it("renders continue row for last viewed webhook subscription", () => {
    render(
      <WebhooksContinueLastViewedRow
        target={{ subscriptionId: "sub-1", name: "Ops webhook" }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("webhooks-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("webhooks-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Ops webhook")).toBeInTheDocument();
  });
});
