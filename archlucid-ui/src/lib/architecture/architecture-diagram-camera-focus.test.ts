import { describe, expect, it } from "vitest";

import {
  diagramOutlineIncludesFocusResource,
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
        { from: "a", to: "b", label: null, source: "observed", declaredConnectionId: null },
        { from: "b", to: "c", label: null, source: "observed", declaredConnectionId: null },
      ],
    });

    expect(focusIds).toEqual(["b", "a", "c"]);
  });

  it("returns empty set for empty seed", () => {
    expect(resolveDiagramCameraFocusNodeIds("", { nodes: [], edges: [] })).toEqual([]);
  });

  it("matches seed and outline endpoint ids case-insensitively", () => {
    const focusIds = resolveDiagramCameraFocusNodeIds(" B ", {
      nodes: [
        { id: "a", label: "A", resourceType: null, resourceGroup: null },
        { id: "b", label: "B", resourceType: null, resourceGroup: null },
        { id: "c", label: "C", resourceType: null, resourceGroup: null },
      ],
      edges: [
        { from: "a", to: "b", label: null, source: "observed", declaredConnectionId: null },
        { from: "b", to: "c", label: null, source: "observed", declaredConnectionId: null },
      ],
    });

    expect(focusIds).toEqual(["B", "a", "c"]);
  });
});

describe("diagramOutlineIncludesFocusResource", () => {
  it("matches outline node ids case-insensitively", () => {
    expect(
      diagramOutlineIncludesFocusResource(
        {
          nodes: [{ id: "adf-edw-hi-dev", label: "ADF", resourceType: null, resourceGroup: null }],
          edges: [],
        },
        "/subscriptions/sub/.../factories/ADF-EDW-HI-DEV",
      ),
    ).toBe(true);
  });

  it("returns false when the resource is absent", () => {
    expect(
      diagramOutlineIncludesFocusResource(
        {
          nodes: [{ id: "other", label: "Other", resourceType: null, resourceGroup: null }],
          edges: [],
        },
        "missing",
      ),
    ).toBe(false);
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
