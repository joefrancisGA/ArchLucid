import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestSubscriptionsContinueLastViewedRow } from "./DigestSubscriptionsContinueLastViewedRow";

describe("DigestSubscriptionsContinueLastViewedRow", () => {
  it("renders continue row for last viewed subscription", () => {
    render(
      <DigestSubscriptionsContinueLastViewedRow
        target={{ subscriptionId: "sub-1", name: "Ops mailbox" }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("digest-subscriptions-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("digest-subscriptions-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Ops mailbox")).toBeInTheDocument();
  });
});
