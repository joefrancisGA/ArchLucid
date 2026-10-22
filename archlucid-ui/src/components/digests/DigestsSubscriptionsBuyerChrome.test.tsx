import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DigestsSubscriptionsBuyerChrome } from "@/components/digests/DigestsSubscriptionsBuyerChrome";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

describe("DigestsSubscriptionsBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<DigestsSubscriptionsBuyerChrome />);

    expect(screen.getByTestId("digests-subscriptions-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("digests-subscriptions-settings-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<DigestsSubscriptionsBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
