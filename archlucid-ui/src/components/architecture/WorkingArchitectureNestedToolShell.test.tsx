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
import {
  WORKING_ARCHITECTURE_NESTED_PRIMARY_CONTENT_ID,
  workingArchitectureNestedClaimDiscipline,
  workingArchitectureNestedClaimDisciplineTestId,
  workingArchitectureNestedContextStrip,
  workingArchitectureNestedKeyboardHint,
  workingArchitectureNestedSkipLinkLabel,
} from "@/lib/architecture/working-architecture-nested-tool-copy";

function mockIdentityQuery(overrides: Record<string, unknown> = {}) {
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
    ...overrides,
  });
}

describe("WorkingArchitectureNestedToolShell", () => {
  it("renders nested tool chrome in Working mode", () => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: true });
    mockIdentityQuery();

    render(
      <WorkingArchitectureNestedToolShell architectureId="customer-intake" toolLabel="Ask">
        <div data-testid="nested-tool-body">Body</div>
      </WorkingArchitectureNestedToolShell>,
    );

    expect(screen.getByTestId("working-architecture-nested-tool-shell")).toBeInTheDocument();
    expect(screen.getByTestId("working-nested-architecture-identity-chrome")).toBeInTheDocument();
    expect(screen.getByTestId("working-architecture-nested-wayfinding")).toBeInTheDocument();
    expect(screen.getByTestId("working-architecture-nested-keyboard-hint")).toBeInTheDocument();
    expect(screen.getByTestId("working-architecture-nested-tool-context-strip")).toBeInTheDocument();
    expect(screen.getByTestId("nested-tool-body")).toBeInTheDocument();
  });

  it("renders skip link, claim discipline, and primary content anchor for Ask", () => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: true });
    mockIdentityQuery();

    render(
      <WorkingArchitectureNestedToolShell architectureId="customer-intake" toolLabel="Ask">
        <div>Body</div>
      </WorkingArchitectureNestedToolShell>,
    );

    expect(screen.getByRole("link", { name: workingArchitectureNestedSkipLinkLabel("Ask") })).toHaveAttribute(
      "href",
      `#${WORKING_ARCHITECTURE_NESTED_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId(workingArchitectureNestedClaimDisciplineTestId("Ask"))).toHaveTextContent(
      workingArchitectureNestedClaimDiscipline("Ask"),
    );
    expect(screen.getByTestId(WORKING_ARCHITECTURE_NESTED_PRIMARY_CONTENT_ID)).toHaveAttribute(
      "id",
      WORKING_ARCHITECTURE_NESTED_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("working-architecture-nested-tool-context-strip")).toHaveTextContent(
      workingArchitectureNestedContextStrip("Ask"),
    );
    expect(screen.getByTestId("working-architecture-nested-keyboard-hint")).toHaveTextContent(
      workingArchitectureNestedKeyboardHint("Ask"),
    );
  });

  it("shows honest resume loading state for customer-intake slug", () => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: true });
    mockIdentityQuery({ isLoading: true, data: undefined });

    render(
      <WorkingArchitectureNestedToolShell architectureId="customer-intake" toolLabel="Graph">
        <div>Body</div>
      </WorkingArchitectureNestedToolShell>,
    );

    expect(screen.getByTestId("working-architecture-nested-resume-strip-loading")).toBeInTheDocument();
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
