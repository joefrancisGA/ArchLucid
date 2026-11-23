import { describe, expect, it } from "vitest";

import { resolveDiagramClickFocus, resolveInventoryDiagramClickFocusId } from "@/lib/architecture/architecture-diagram-click-focus";

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

    expect([...result.keptNodeIds].sort()).toEqual(["vault", "vminvneta", "vneta"]);
    expect(result.keptFrameIds).toEqual(new Set(["vnet-vnet-a"]));
    expect(result.keptEdgeIndexes).toEqual(new Set([0]));
  });

  it("maps a flowchart node id to the outline id before resolving neighbors", () => {
    const outline = {
      nodes: [
        { id: "api", label: "API", resourceType: null, resourceGroup: null },
        { id: "gateway", label: "Gateway", resourceType: null, resourceGroup: null },
      ],
      edges: [
        { from: "api", to: "gateway", label: null, source: "observed", declaredConnectionId: null },
      ],
    };
    const focusId = resolveInventoryDiagramClickFocusId("flowchart-api-0", "api", outline);
    const result = resolveDiagramClickFocus(focusId, outline, {
      nodes: [
        { id: "flowchart-api-0", center: { x: 10, y: 10 } },
        { id: "flowchart-gateway-1", center: { x: 100, y: 10 } },
      ],
      frames: [],
      edges: [],
    });

    expect(focusId).toBe("api");
    expect([...result.keptNodeIds].sort()).toEqual(["api", "gateway"]);
  });

  it("maps forest accessibility titles to outline ids for neighbor dimming", () => {
    const outline = {
      nodes: [
        {
          id: "vm-app",
          label: "vm-app (Virtual machine)",
          resourceType: "Microsoft.Compute/virtualMachines",
          resourceGroup: "rg-app-prod",
        },
        {
          id: "sqldb-app",
          label: "sqldb-app (SQL database)",
          resourceType: "Microsoft.Sql/servers/databases",
          resourceGroup: "rg-data-prod",
        },
      ],
      edges: [
        {
          from: "vm-app",
          to: "sqldb-app",
          label: null,
          source: "observed",
          declaredConnectionId: null,
        },
      ],
    };
    const focusId = resolveInventoryDiagramClickFocusId(
      "flowchart-vm-app-0",
      "vm-app (Virtual machine)",
      outline,
    );
    const result = resolveDiagramClickFocus(focusId, outline, {
      nodes: [
        { id: "flowchart-vm-app-0", center: { x: 10, y: 10 } },
        { id: "flowchart-sqldb-app-1", center: { x: 120, y: 10 } },
      ],
      frames: [],
      edges: [],
    });

    expect(focusId).toBe("vm-app");
    expect([...result.keptNodeIds].sort()).toEqual(["sqldbapp", "vmapp"]);
  });
});