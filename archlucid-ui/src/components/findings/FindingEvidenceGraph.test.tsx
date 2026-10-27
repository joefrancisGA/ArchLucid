import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FindingEvidenceGraph } from "@/components/findings/FindingEvidenceGraph";

const workspaceModeMock = vi.hoisted(() => ({
  mode: "working" as const,
  mounted: true,
  accountSyncState: "synced" as const,
  isWorkingMode: true,
  setAndPersist: vi.fn(),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

const loadArchitectureGraphViewModelMock = vi.hoisted(() =>
  vi.fn(async () => ({
    ok: true,
    graph: {
      nodes: [{ id: "vm-1", label: "VM", type: "GraphNode", metadata: {} }],
      edges: [],
      nodeCount: 1,
      edgeCount: 0,
    },
    note: null,
  })),
);

vi.mock("@/lib/load-architecture-graph-view-model", () => ({
  loadArchitectureGraphViewModel: loadArchitectureGraphViewModelMock,
}));

describe("FindingEvidenceGraph (LI-15)", () => {
  beforeEach(() => {
    workspaceModeMock.mode = "working";
    workspaceModeMock.isWorkingMode = true;
    workspaceModeMock.mounted = true;
  });

  it("defaults Working mode to outline list view", async () => {
    render(<FindingEvidenceGraph runId="run-1" graphNodeIdsExamined={["vm-1"]} />);

    await waitFor(() => {
      expect(screen.getByTestId("finding-evidence-graph-outline")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("finding-evidence-graph-canvas")).toBeNull();
  });

  it("labels an empty architecture graph as not stored", async () => {
    workspaceModeMock.mode = "guided";
    workspaceModeMock.isWorkingMode = false;

    loadArchitectureGraphViewModelMock.mockResolvedValueOnce({
      ok: true,
      graph: {
        nodes: [],
        edges: [],
        nodeCount: 0,
        edgeCount: 0,
      },
      note: null,
    });

    render(<FindingEvidenceGraph runId="run-1" graphNodeIdsExamined={["vm-1"]} />);

    await waitFor(() => {
      expect(screen.getByText("Architecture graph was not stored")).toBeInTheDocument();
    });
  });

  it("defaults Guided mode to graph canvas", async () => {
    workspaceModeMock.mode = "guided";
    workspaceModeMock.isWorkingMode = false;

    render(<FindingEvidenceGraph runId="run-1" graphNodeIdsExamined={["vm-1"]} />);

    await waitFor(() => {
      expect(screen.getByTestId("finding-evidence-graph-canvas")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("finding-evidence-graph-outline")).toBeNull();
  });
});
