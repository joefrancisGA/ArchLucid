import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useWorkspaceModeMock = vi.fn();
const useArchitectureDeskDiagramSourcesQueryMock = vi.fn();

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => useWorkspaceModeMock(),
}));

vi.mock("@/hooks/use-architecture-desk-diagram-sources-query", () => ({
  useArchitectureDeskDiagramSourcesQuery: (...args: unknown[]) =>
    useArchitectureDeskDiagramSourcesQueryMock(...args),
}));

import { ArchitectureIdentityDeskDiagramSourcesStrip } from "@/components/architecture/ArchitectureIdentityDeskDiagramSourcesStrip";

describe("ArchitectureIdentityDeskDiagramSourcesStrip (AS-044)", () => {
  beforeEach(() => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: true });
  });

  it("renders nothing outside Working mode", () => {
    useWorkspaceModeMock.mockReturnValue({ isWorkingMode: false });
    useArchitectureDeskDiagramSourcesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
      blockedReason: null,
    });

    const { container } = render(
      <ArchitectureIdentityDeskDiagramSourcesStrip latestReviewId="review-1" />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(useArchitectureDeskDiagramSourcesQueryMock).toHaveBeenCalledWith("review-1", { enabled: false });
  });

  it("renders nothing when there is no latest review", () => {
    useArchitectureDeskDiagramSourcesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
      blockedReason: null,
    });

    const { container } = render(
      <ArchitectureIdentityDeskDiagramSourcesStrip latestReviewId={null} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(useArchitectureDeskDiagramSourcesQueryMock).toHaveBeenCalledWith("", { enabled: false });
  });

  it("shows an honest empty state when the latest review has no diagram sources", () => {
    useArchitectureDeskDiagramSourcesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
      blockedReason: null,
    });

    render(<ArchitectureIdentityDeskDiagramSourcesStrip latestReviewId="review-2" />);

    expect(screen.getByTestId("architecture-identity-desk-diagram-sources-empty")).toHaveTextContent(
      "No diagram sources on the latest review.",
    );
  });

  it("lists analyzed and not-extracted diagram sources from the latest review", () => {
    useArchitectureDeskDiagramSourcesQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          sourceKey: "structured:topology.mmd",
          label: "topology.mmd",
          status: "analyzed",
          nodeCount: 2,
        },
        {
          sourceKey: "pixel:legacy.png",
          label: "legacy.png",
          status: "not-extracted",
          nodeCount: null,
        },
      ],
      refetch: vi.fn(),
      blockedReason: null,
    });

    render(<ArchitectureIdentityDeskDiagramSourcesStrip latestReviewId="review-2" />);

    expect(screen.getByTestId("architecture-identity-desk-diagram-sources-list")).toHaveTextContent(
      "topology.mmd — Topology analyzed (2 nodes)",
    );
    expect(screen.getByTestId("architecture-identity-desk-diagram-sources-list")).toHaveTextContent(
      "legacy.png — Topology not extracted",
    );
  });
});
