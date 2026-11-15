import { afterEach, describe, expect, it, vi } from "vitest";

import { loadArchitectureGraphViewModel } from "@/lib/load-architecture-graph-view-model";

describe("architecture graph pagination fallback", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads the paginated endpoint after HTTP 413", async () => {
    const fetchGraph = vi.fn()
      .mockResolvedValueOnce(new Response("Graph is too large.", { status: 413 }))
      .mockResolvedValueOnce(Response.json({
        nodes: [{ id: "node-1", label: "Node", type: "Service" }],
        edges: [],
        hasMore: false,
      }));
    vi.stubGlobal("fetch", fetchGraph);

    const result = await loadArchitectureGraphViewModel("run-1");

    expect(result).toMatchObject({ ok: true, graph: { nodes: [{ id: "node-1" }] } });
    expect(fetchGraph).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/v1/evidence-graph/reviews/run-1/nodes?page=1&pageSize=200"),
      expect.anything(),
    );
  });
});
