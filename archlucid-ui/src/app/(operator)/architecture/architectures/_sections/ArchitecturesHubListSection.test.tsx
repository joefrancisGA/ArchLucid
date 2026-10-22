import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: false }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/components/architecture/ArchitectureDraftListClient", () => ({
  ArchitectureDraftListClient: () => <div data-testid="architecture-draft-list" />,
}));

vi.mock("@/components/architecture/ArchitectureIdentityListClient", () => ({
  ArchitectureIdentityListClient: () => <div data-testid="architecture-identity-list" />,
}));

vi.mock("@/components/architecture/ArchitectureWorkingPortfolioDraftsSection", () => ({
  ArchitectureWorkingPortfolioDraftsSection: () => (
    <div data-testid="architecture-working-portfolio-open-drafts" />
  ),
}));

import { ArchitecturesHubListSection } from "./ArchitecturesHubListSection";

describe("ArchitecturesHubListSection (CA-25 / CA-36)", () => {
  beforeEach(() => {
    workspaceModeMock.isWorkingMode = false;
  });

  it("shows draft inventory in Guided mode", () => {
    render(<ArchitecturesHubListSection />);

    expect(screen.getByTestId("architecture-draft-list")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-identity-list")).not.toBeInTheDocument();
  });

  it("SN-029: shows open drafts and architecture identities in Working mode", () => {
    workspaceModeMock.isWorkingMode = true;

    render(<ArchitecturesHubListSection />);

    expect(screen.getByTestId("architectures-hub-working-portfolio")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-working-portfolio-open-drafts")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-identity-list")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-list")).not.toBeInTheDocument();
  });
});
