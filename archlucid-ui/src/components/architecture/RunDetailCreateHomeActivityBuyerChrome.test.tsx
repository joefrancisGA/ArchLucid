import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

import { RunDetailCreateHomeActivityBuyerChrome } from "@/components/architecture/RunDetailCreateHomeActivityBuyerChrome";

describe("RunDetailCreateHomeActivityBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<RunDetailCreateHomeActivityBuyerChrome />);

    expect(screen.getByTestId("architecture-activity-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-activity-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<RunDetailCreateHomeActivityBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
