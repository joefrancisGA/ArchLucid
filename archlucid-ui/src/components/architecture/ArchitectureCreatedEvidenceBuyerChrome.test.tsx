import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedEvidenceBuyerChrome } from "@/components/architecture/ArchitectureCreatedEvidenceBuyerChrome";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

describe("ArchitectureCreatedEvidenceBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<ArchitectureCreatedEvidenceBuyerChrome />);

    expect(screen.getByTestId("architecture-evidence-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-evidence-sources")).toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<ArchitectureCreatedEvidenceBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
