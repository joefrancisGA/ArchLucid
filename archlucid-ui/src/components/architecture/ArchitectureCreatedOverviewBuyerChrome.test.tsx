import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedOverviewBuyerChrome } from "@/components/architecture/ArchitectureCreatedOverviewBuyerChrome";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

describe("ArchitectureCreatedOverviewBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<ArchitectureCreatedOverviewBuyerChrome />);

    expect(screen.getByTestId("architecture-overview-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-overview-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<ArchitectureCreatedOverviewBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
