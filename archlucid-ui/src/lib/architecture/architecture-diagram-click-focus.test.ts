import { describe, expect, it } from "vitest";

import { resolveDiagramClickFocus } from "@/lib/architecture/architecture-diagram-click-focus";

describe("resolveDiagramClickFocus", () => {
  it("keeps the clicked node and its one-hop outline neighbors", () => {
    const result = resolveDiagramClickFocus("b", {
      nodes: [],
      edges: [
        { from: "a", to: "b", label: null, source: "observed", declaredConnectionId: null },
        { from: "b", to: "c", label: null, source: "observed", declaredConnectionId: null },
      ],
    }, {
      nodes: [
        { id: "a", center: { x: 10, y: 10 } },
        { id: "b", center: { x: 20, y: 10 } },
        { id: "c", center: { x: 30, y: 10 } },
        { id: "d", center: { x: 40, y: 10 } },
      ],
      frames: [],
      edges: [],
    });

    expect([...result.keptNodeIds].sort()).toEqual(["a", "b", "c"]);
  });

  it("keeps cards in the clicked node's VNet frame when the outline omits containment", () => {
    const result = resolveDiagramClickFocus("vm", null, {
      nodes: [
        { id: "vm", center: { x: 20, y: 20 } },
        { id: "nic", center: { x: 40, y: 40 } },
        { id: "outside", center: { x: 200, y: 200 } },
      ],
      frames: [
        { id: "vnet-vnet-a", kind: "vnet", rect: { x: 0, y: 0, width: 100, height: 100 } },
      ],
      edges: [],
    });

    expect(result.keptNodeIds).toEqual(new Set(["vm", "nic"]));
    expect(result.keptFrameIds).toEqual(new Set(["vnet-vnet-a"]));
  });

  it("keeps the VNet named by a bundled endpoint edge", () => {
    const result = resolveDiagramClickFocus("vault", {
      nodes: [],
      edges: [{ from: "vault", to: "vnet-a", label: "private endpoint", source: "inferred", declaredConnectionId: null }],
    }, {
      nodes: [
        { id: "vault", center: { x: 20, y: 20 } },
        { id: "vm-in-vnet-a", center: { x: 40, y: 40 } },
      ],
      frames: [
        { id: "vnet-vnet-a", kind: "vnet", rect: { x: 0, y: 0, width: 100, height: 100 } },
      ],
      edges: [
        { from: ["vault", "vault-2"], to: ["vnet-a"] },
        { from: ["vault"], to: ["vnet-b"] },
      ],
    });

    expect(result.keptNodeIds).toEqual(new Set(["vault", "vnet-a", "vm-in-vnet-a"]));
    expect(result.keptFrameIds).toEqual(new Set(["vnet-vnet-a"]));
    expect(result.keptEdgeIndexes).toEqual(new Set([0]));
  });
});
