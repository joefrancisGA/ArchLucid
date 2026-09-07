import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const evalChromeMock = vi.hoisted(() => ({ enabled: true }));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.enabled,
}));

import { ArchitectureCreatedEvidenceBuyerChrome } from "@/components/architecture/ArchitectureCreatedEvidenceBuyerChrome";

describe("ArchitectureCreatedEvidenceBuyerChrome", () => {
  it("renders Sources orientation in Guided eval chrome", () => {
    evalChromeMock.enabled = true;

    render(<ArchitectureCreatedEvidenceBuyerChrome />);

    expect(screen.getByTestId("architecture-evidence-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-evidence-sources")).toBeInTheDocument();
  });

  it("renders nothing outside eval chrome", () => {
    evalChromeMock.enabled = false;

    const { container } = render(<ArchitectureCreatedEvidenceBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
