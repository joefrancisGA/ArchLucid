import { describe, expect, it } from "vitest";

import { countActorNodesInGraphSnapshot } from "@/lib/graph-snapshot-actor-count";

describe("countActorNodesInGraphSnapshot", () => {
  it("returns null when snapshot or nodes array was not stored", () => {
    expect(countActorNodesInGraphSnapshot(null)).toBeNull();
    expect(countActorNodesInGraphSnapshot(undefined)).toBeNull();
    expect(countActorNodesInGraphSnapshot({})).toBeNull();
    expect(countActorNodesInGraphSnapshot({ nodes: "not-array" })).toBeNull();
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
