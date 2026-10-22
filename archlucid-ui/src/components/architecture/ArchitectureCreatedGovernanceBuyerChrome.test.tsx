import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/architecture/architecture-created-governance-sources";

import { ArchitectureCreatedGovernanceBuyerChrome } from "./ArchitectureCreatedGovernanceBuyerChrome";

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => demoEnvMock.evalChrome,
}));

const demoEnvMock = vi.hoisted(() => ({
  evalChrome: true,
}));

describe("ArchitectureCreatedGovernanceBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.evalChrome = true;

    render(<ArchitectureCreatedGovernanceBuyerChrome />);

    expect(screen.getByTestId(ARCHITECTURE_CREATED_GOVERNANCE_ORIENTATION_BOTTOM_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-governance-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-governance-claim-discipline")).not.toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.evalChrome = false;

    const { container } = render(<ArchitectureCreatedGovernanceBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
