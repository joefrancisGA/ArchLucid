import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedGovernanceBuyerChrome } from "@/components/architecture/ArchitectureCreatedGovernanceBuyerChrome";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

describe("ArchitectureCreatedGovernanceBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<ArchitectureCreatedGovernanceBuyerChrome />);

    expect(screen.getByTestId("architecture-governance-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-governance-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<ArchitectureCreatedGovernanceBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
