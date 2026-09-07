import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedFindingsBuyerChrome } from "@/components/architecture/ArchitectureCreatedFindingsBuyerChrome";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

describe("ArchitectureCreatedFindingsBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<ArchitectureCreatedFindingsBuyerChrome />);

    expect(screen.getByTestId("architecture-findings-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-findings-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<ArchitectureCreatedFindingsBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
