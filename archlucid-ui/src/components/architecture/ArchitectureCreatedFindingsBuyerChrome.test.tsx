import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const evalChromeMock = vi.hoisted(() => ({ enabled: true }));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.enabled,
}));

import { ArchitectureCreatedFindingsBuyerChrome } from "@/components/architecture/ArchitectureCreatedFindingsBuyerChrome";

describe("ArchitectureCreatedFindingsBuyerChrome", () => {
  it("renders Sources orientation in Guided eval chrome", () => {
    evalChromeMock.enabled = true;

    render(<ArchitectureCreatedFindingsBuyerChrome />);

    expect(screen.getByTestId("architecture-findings-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-findings-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-findings-claim-discipline")).not.toBeInTheDocument();
  });

  it("renders nothing outside eval chrome", () => {
    evalChromeMock.enabled = false;

    const { container } = render(<ArchitectureCreatedFindingsBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
