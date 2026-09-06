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

  it("shows architecture identities in Working mode", () => {
    workspaceModeMock.isWorkingMode = true;

    render(<ArchitecturesHubListSection />);

    expect(screen.getByTestId("architecture-identity-list")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-list")).not.toBeInTheDocument();
  });
});
