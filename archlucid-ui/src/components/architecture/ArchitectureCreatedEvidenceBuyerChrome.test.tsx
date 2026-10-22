import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const evalChromeMock = vi.hoisted(() => ({ enabled: true }));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeMock.enabled,
}));

import { ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/architecture/architecture-created-evidence-sources";

import { ArchitectureCreatedEvidenceBuyerChrome } from "./ArchitectureCreatedEvidenceBuyerChrome";

describe("ArchitectureCreatedEvidenceBuyerChrome", () => {
  it("renders Sources orientation in Guided eval chrome", () => {
    evalChromeMock.enabled = true;

    render(<ArchitectureCreatedEvidenceBuyerChrome />);

    expect(screen.getByTestId(ARCHITECTURE_CREATED_EVIDENCE_ORIENTATION_BOTTOM_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-evidence-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-evidence-claim-discipline")).not.toBeInTheDocument();
  });

  it("renders nothing outside eval chrome", () => {
    evalChromeMock.enabled = false;

    const { container } = render(<ArchitectureCreatedEvidenceBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
