import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const evalChromeMock = vi.hoisted(() => ({ enabled: true }));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.enabled,
}));

import { ArchitectureCreatedOverviewBuyerChrome } from "@/components/architecture/ArchitectureCreatedOverviewBuyerChrome";

describe("ArchitectureCreatedOverviewBuyerChrome", () => {
  it("renders Sources orientation in Guided eval chrome", () => {
    evalChromeMock.enabled = true;

    render(<ArchitectureCreatedOverviewBuyerChrome />);

    expect(screen.getByTestId("architecture-overview-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-overview-sources")).toBeInTheDocument();
  });

  it("renders nothing outside eval chrome", () => {
    evalChromeMock.enabled = false;

    const { container } = render(<ArchitectureCreatedOverviewBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
