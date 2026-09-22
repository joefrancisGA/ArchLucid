import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useWorkspaceModeMock = vi.fn();
const useArchitectureIdentityQueryMock = vi.fn();

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => useWorkspaceModeMock(),
}));

vi.mock("@/hooks/use-architecture-identity-query", () => ({
  useArchitectureIdentityQuery: (...args: unknown[]) => useArchitectureIdentityQueryMock(...args),
}));

vi.mock("@/components/architecture/WorkingInstrumentDocumentTitle", () => ({
  WorkingInstrumentDocumentTitle: () => <div data-testid="working-instrument-document-title" />,
}));

import { WorkingArchitectureNestedToolShell } from "@/components/architecture/WorkingArchitectureNestedToolShell";

describe("WorkingArchitectureNestedToolShell", () => {
  it("renders nested tool chrome in Working mode", () => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: true });
    useArchitectureIdentityQueryMock.mockReturnValue({
      data: {
        architectureId: "customer-intake",
        displayName: "Customer intake",
        archivedUtc: null,
        currentDraftId: null,
        latestReviewId: null,
        drafts: [],
      },
      isLoading: false,
      isError: false,
      blockedReason: null,
    });

    render(
      <WorkingArchitectureNestedToolShell architectureId="customer-intake" toolLabel="Ask">
        <div data-testid="nested-tool-body">Body</div>
      </WorkingArchitectureNestedToolShell>,
    );

    expect(screen.getByTestId("working-architecture-nested-tool-shell")).toBeInTheDocument();
    expect(screen.getByTestId("working-nested-architecture-identity-chrome")).toBeInTheDocument();
    expect(screen.getByTestId("working-architecture-nested-wayfinding")).toBeInTheDocument();
    expect(screen.getByTestId("working-architecture-nested-keyboard-hint")).toBeInTheDocument();
    expect(screen.getByTestId("nested-tool-body")).toBeInTheDocument();
  });

  it("passes through children in Guided mode", () => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: false });

    render(
      <WorkingArchitectureNestedToolShell architectureId="customer-intake" toolLabel="Ask">
        <div data-testid="nested-tool-body">Body</div>
      </WorkingArchitectureNestedToolShell>,
    );

    expect(screen.queryByTestId("working-architecture-nested-tool-shell")).not.toBeInTheDocument();
    expect(screen.getByTestId("nested-tool-body")).toBeInTheDocument();
  });
});
