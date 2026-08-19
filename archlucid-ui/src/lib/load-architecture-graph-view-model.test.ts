import { describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import { getArchitectureGraph, mergeArchitectureGraphPages } from "@/lib/graph-api";
import { loadArchitectureGraphViewModel } from "@/lib/load-architecture-graph-view-model";

vi.mock("@/lib/graph-api", () => ({
  getArchitectureGraph: vi.fn(),
  mergeArchitectureGraphPages: vi.fn(),
}));

describe("loadArchitectureGraphViewModel", () => {
  it("returns failure for empty run id", async () => {
    const r = await loadArchitectureGraphViewModel("  ");

    expect(r.ok).toBe(false);
    if (r.ok) {
      throw new Error("expected failure");
    }

    expect(r.kind).toBe("failure");
    expect(r.failure.message.toLowerCase()).toMatch(/required/);
  });

  it("merges pages after HTTP 413 and attaches a note", async () => {
    vi.mocked(getArchitectureGraph).mockRejectedValueOnce(
      new ApiRequestError("payload too large", {
        problem: null,
        correlationId: null,
        httpStatus: 413,
      }),
    );
    vi.mocked(mergeArchitectureGraphPages).mockResolvedValueOnce({
      nodes: [{ id: "a", label: "A", type: "Service" }],
      edges: [],
    });

    const r = await loadArchitectureGraphViewModel("run-1");

    expect(r.ok).toBe(true);
    if (!r.ok) {
      throw new Error("expected ok");
    }

    expect(r.graph.nodes).toHaveLength(1);
    expect(r.note).toContain("paginated");
  });
});
