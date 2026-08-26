import { describe, expect, it } from "vitest";

import { countActorNodesInGraphSnapshot } from "@/lib/graph-snapshot-actor-count";

describe("countActorNodesInGraphSnapshot", () => {
  it("returns zero for missing or invalid snapshots", () => {
    expect(countActorNodesInGraphSnapshot(null)).toBe(0);
    expect(countActorNodesInGraphSnapshot(undefined)).toBe(0);
    expect(countActorNodesInGraphSnapshot({})).toBe(0);
    expect(countActorNodesInGraphSnapshot({ nodes: "not-array" })).toBe(0);
  });

  it("counts actor nodes case-insensitively", () => {
    const count = countActorNodesInGraphSnapshot({
      nodes: [
        { nodeType: "Actor" },
        { nodeType: "service" },
        { nodeType: "actor" },
        { nodeType: "ACTOR" },
      ],
    });

    expect(count).toBe(3);
  });
});
