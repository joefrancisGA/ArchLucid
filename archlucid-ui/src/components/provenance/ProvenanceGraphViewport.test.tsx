import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProvenanceGraphViewport } from "@/components/provenance/ProvenanceGraphViewport";
import type { ArchitectureLinkageEdge, ArchitectureLinkageNode } from "@/types/architecture-provenance";

const navigationMock = vi.hoisted(() => ({
  pathname: "/architecture/reviews/r1/provenance",
  replace: vi.fn(),
  search: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
  useRouter: () => ({ replace: navigationMock.replace }),
  useSearchParams: () => new URLSearchParams(navigationMock.search),
}));

const nodes: ArchitectureLinkageNode[] = [
  { id: "n-ctx", type: "ContextSnapshot", referenceId: "ctx-1", name: "Source context reviewed" },
  { id: "n-find", type: "Finding", referenceId: "f-1", name: "PHI minimization risk" },
  { id: "n-manifest", type: "GoldenManifest", referenceId: "m-1", name: "Finalized review record" },
];

const edges: ArchitectureLinkageEdge[] = [
  { id: "e-1", type: "supports", fromNodeId: "n-ctx", toNodeId: "n-find" },
  { id: "e-2", type: "recorded in", fromNodeId: "n-find", toNodeId: "n-manifest" },
];

beforeEach(() => {
  globalThis.ResizeObserver = class {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(): void {
      this.callback(
        [
          {
            contentRect: {
              width: 960,
              height: 580,
              top: 0,
              left: 0,
              bottom: 580,
              right: 960,
              x: 0,
              y: 0,
              toJSON: () => ({}),
            },
          } as ResizeObserverEntry,
        ],
        this,
      );
    }

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

describe("ProvenanceGraphViewport", () => {
  it("uses a full-width container without horizontal overflow", async () => {
    const onSelectNode = vi.fn();

    render(
      <div style={{ width: "960px" }}>
        <ProvenanceGraphViewport
          nodes={nodes}
          edges={edges}
          selectedNodeId={null}
          highlightedEdgeId={null}
          activeFilters={new Set()}
          layoutSeed={0}
          onSelectNode={onSelectNode}
          onHighlightEdge={vi.fn()}
        />
      </div>,
    );

    const container = screen.getByTestId("provenance-graph-container");

    expect(container.className).not.toMatch(/overflow-x-auto/);
    expect(container).toHaveStyle({ minHeight: "580px" });

    await waitFor(() => {
      expect(screen.getByTestId("provenance-graph-svg")).toHaveClass("opacity-100");
    });
  });

  it("exposes keyboard-accessible zoom controls", async () => {
    render(
      <ProvenanceGraphViewport
        nodes={nodes}
        edges={edges}
        selectedNodeId={null}
        highlightedEdgeId={null}
        activeFilters={new Set()}
        layoutSeed={0}
        onSelectNode={vi.fn()}
        onHighlightEdge={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fit graph to view" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset graph layout" })).toBeInTheDocument();
  });

  it("selects nodes from the graph", async () => {
    const onSelectNode = vi.fn();

    render(
      <ProvenanceGraphViewport
        nodes={nodes}
        edges={edges}
        selectedNodeId={null}
        highlightedEdgeId={null}
        activeFilters={new Set()}
        layoutSeed={0}
        onSelectNode={onSelectNode}
        onHighlightEdge={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("provenance-node-n-find")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("provenance-node-n-find"));

    expect(onSelectNode).toHaveBeenCalledWith("n-find");
  });

  it("activates nodes from the keyboard", async () => {
    const onSelectNode = vi.fn();

    render(
      <ProvenanceGraphViewport
        nodes={nodes}
        edges={edges}
        selectedNodeId={null}
        highlightedEdgeId={null}
        activeFilters={new Set()}
        layoutSeed={0}
        onSelectNode={onSelectNode}
        onHighlightEdge={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("provenance-node-n-find")).toBeInTheDocument();
    });

    const node = screen.getByTestId("provenance-node-n-find");
    node.focus();
    fireEvent.keyDown(node, { key: "Enter" });

    expect(onSelectNode).toHaveBeenCalledWith("n-find");
  });

  it("shows a fallback panel when rendering fails", () => {
    const onRetry = vi.fn();

    render(
      <ProvenanceGraphViewport
        nodes={nodes}
        edges={edges}
        selectedNodeId={null}
        highlightedEdgeId={null}
        activeFilters={new Set()}
        layoutSeed={0}
        onSelectNode={vi.fn()}
        onHighlightEdge={vi.fn()}
        renderFailed
        onRetryRender={onRetry}
      />,
    );

    expect(screen.getByTestId("provenance-graph-fallback")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry graph" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("offers tables view from the render-failed fallback", () => {
    const onOpenTables = vi.fn();

    render(
      <ProvenanceGraphViewport
        nodes={nodes}
        edges={edges}
        selectedNodeId={null}
        highlightedEdgeId={null}
        activeFilters={new Set()}
        layoutSeed={0}
        onSelectNode={vi.fn()}
        onHighlightEdge={vi.fn()}
        renderFailed
        onOpenTablesView={onOpenTables}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Tables view" }));
    expect(onOpenTables).toHaveBeenCalled();
  });
});
