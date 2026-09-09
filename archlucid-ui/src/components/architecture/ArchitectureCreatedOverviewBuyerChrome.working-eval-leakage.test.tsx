import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const evalChromeMock = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.enabled,
}));

import { ArchitectureCreatedOverviewBuyerChrome } from "@/components/architecture/ArchitectureCreatedOverviewBuyerChrome";

describe("ArchitectureCreatedOverviewBuyerChrome working eval leakage guard (WS-09)", () => {
  beforeEach(() => {
    evalChromeMock.enabled = false;
  });

  it("renders nothing on Working production chrome", () => {
    const { container } = render(<ArchitectureCreatedOverviewBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders Sources orientation in Guided eval chrome", () => {
    evalChromeMock.enabled = true;

    render(<ArchitectureCreatedOverviewBuyerChrome />);

    expect(screen.getByTestId("architecture-overview-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-overview-sources")).toBeInTheDocument();
  });
});
