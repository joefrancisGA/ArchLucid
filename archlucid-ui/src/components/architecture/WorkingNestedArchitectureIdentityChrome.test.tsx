import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useArchitectureIdentityQueryMock = vi.fn();
const useWorkspaceModeMock = vi.fn();

vi.mock("@/hooks/use-architecture-identity-query", () => ({
  useArchitectureIdentityQuery: (...args: unknown[]) => useArchitectureIdentityQueryMock(...args),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => useWorkspaceModeMock(),
}));

import { WorkingNestedArchitectureIdentityChrome } from "@/components/architecture/WorkingNestedArchitectureIdentityChrome";
import { WorkingNestedArchitectureIdentityChromeMount } from "@/components/architecture/WorkingNestedArchitectureIdentityChromeMount";

describe("WorkingNestedArchitectureIdentityChrome (AO-34)", () => {
  it("AO-34: renders architecture identity chrome with desk link", () => {
    useArchitectureIdentityQueryMock.mockReturnValue({
      data: {
        architectureId: "architecture-identity-001",
        displayName: "Payments platform",
        archivedUtc: null,
      },
    });

    render(<WorkingNestedArchitectureIdentityChrome architectureId="architecture-identity-001" />);

    expect(screen.getByTestId("working-nested-architecture-identity-chrome")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Payments platform" })).toHaveAttribute(
      "href",
      "/architecture/architectures/architecture-identity-001",
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});

describe("WorkingNestedArchitectureIdentityChromeMount (AO-34)", () => {
  it("AO-34: present on Working nested review when parent architecture is known", () => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: true });
    useArchitectureIdentityQueryMock.mockReturnValue({
      data: {
        architectureId: "architecture-identity-001",
        displayName: "Payments platform",
        archivedUtc: null,
      },
    });

    render(<WorkingNestedArchitectureIdentityChromeMount parentArchitectureId="architecture-identity-001" />);

    expect(screen.getByTestId("working-nested-architecture-identity-chrome")).toBeInTheDocument();
  });

  it("AO-34: absent on Guided peer review routes", () => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: false });

    const { container } = render(
      <WorkingNestedArchitectureIdentityChromeMount parentArchitectureId="architecture-identity-001" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
