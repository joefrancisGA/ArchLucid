import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

import { ArchitectureCreatedDiagramBuyerChrome } from "@/components/architecture/ArchitectureCreatedDiagramBuyerChrome";

describe("ArchitectureCreatedDiagramBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<ArchitectureCreatedDiagramBuyerChrome />);

    expect(screen.getByTestId("architecture-diagram-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<ArchitectureCreatedDiagramBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
