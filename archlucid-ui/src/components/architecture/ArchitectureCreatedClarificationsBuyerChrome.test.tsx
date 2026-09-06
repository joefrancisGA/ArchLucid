import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

import { ArchitectureCreatedClarificationsBuyerChrome } from "@/components/architecture/ArchitectureCreatedClarificationsBuyerChrome";

describe("ArchitectureCreatedClarificationsBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<ArchitectureCreatedClarificationsBuyerChrome />);

    expect(screen.getByTestId("architecture-clarifications-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-clarifications-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<ArchitectureCreatedClarificationsBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
