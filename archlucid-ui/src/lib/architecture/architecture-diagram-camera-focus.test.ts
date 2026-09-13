import { describe, expect, it } from "vitest";

import {
  inventoryDiagramNodeElementMatchesFocusId,
  resolveDiagramCameraFocusNodeIds,
} from "@/lib/architecture/architecture-diagram-camera-focus";

describe("resolveDiagramCameraFocusNodeIds", () => {
  it("returns seed plus one-hop neighbors", () => {
    const focusIds = resolveDiagramCameraFocusNodeIds("b", {
      nodes: [
        { id: "a", label: "A", resourceType: null, resourceGroup: null },
        { id: "b", label: "B", resourceType: null, resourceGroup: null },
        { id: "c", label: "C", resourceType: null, resourceGroup: null },
      ],
      edges: [
        { from: "a", to: "b", label: null },
        { from: "b", to: "c", label: null },
      ],
    });

    expect(focusIds).toEqual(["b", "a", "c"]);
  });

  it("returns empty set for empty seed", () => {
    expect(resolveDiagramCameraFocusNodeIds("", { nodes: [], edges: [] })).toEqual([]);
  });
});

describe("inventoryDiagramNodeElementMatchesFocusId", () => {
  it("matches mapped node id tokens", () => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    node.setAttribute("id", "flowchart-api-0");
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = "api";
    node.appendChild(title);

    expect(inventoryDiagramNodeElementMatchesFocusId(node, ["api"])).toBe(true);
  });
});
