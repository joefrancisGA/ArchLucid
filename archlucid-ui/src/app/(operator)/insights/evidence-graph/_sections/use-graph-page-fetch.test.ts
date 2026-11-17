import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import { getArchitectureGraph, mergeArchitectureGraphPages } from "@/lib/graph-api";

import { useGraphPageFetch } from "./use-graph-page-fetch";

vi.mock("@/lib/graph-api", () => ({
  getArchitectureGraph: vi.fn(),
  mergeArchitectureGraphPages: vi.fn(),
}));

describe("useGraphPageFetch", () => {
  it("ignores the pagination note from a superseded architecture graph", async () => {
    type Graph = Awaited<ReturnType<typeof mergeArchitectureGraphPages>>;
    const graph: Graph = { nodes: [], edges: [] };
    const older = Promise.withResolvers<Graph>();
    vi.mocked(getArchitectureGraph)
      .mockRejectedValueOnce(new ApiRequestError("Graph is too large.", {
        httpStatus: 413,
        problem: null,
        correlationId: null,
      }))
      .mockResolvedValueOnce(graph);
    vi.mocked(mergeArchitectureGraphPages).mockReturnValueOnce(older.promise);
    const setTypeFilter = vi.fn();
    const setGraphInteractiveReady = vi.fn();
    const { result } = renderHook(() => useGraphPageFetch({
      runId: "old-review",
      mode: "architecture",
      decisionId: "",
      nodeId: "",
      depth: 1,
      typeFilter: "",
      buyerPolishedShell: false,
      setTypeFilter,
      setGraphInteractiveReady,
    }));
    let first: Promise<void> | undefined;

    await act(async () => {
      first = result.current.performGraphLoad();
    });
    expect(mergeArchitectureGraphPages).toHaveBeenCalledWith("old-review");
    await act(() => result.current.performGraphLoad({ runId: "new-review" }));
    expect(result.current.graph).not.toBeNull();

    await act(async () => {
      older.resolve(graph);
      await first;
    });
    expect(result.current.architectureGraphNote).toBeNull();
  });
});
