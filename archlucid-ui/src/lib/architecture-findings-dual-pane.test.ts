import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_FINDINGS_DUAL_PANE_LAYOUT_MODE_ID,
  ARCHITECTURE_FINDINGS_DUAL_PANE_LINKED_VIEW_TITLE,
  ARCHITECTURE_FINDINGS_DUAL_PANE_TOGGLE_ON_LABEL,
  buildArchitectureFindingsDualPaneDiagramHref,
  buildArchitectureFindingsDualPaneFindingsHref,
  extractRelatedNodeIdsFromFindingWire,
  formatLinkedComponentStatus,
  isArchitectureFindingsLinkedLayout,
  resolveArchitectureFindingsDualPaneLayoutMode,
  resolveFindingDiagramSelectionSync,
} from "@/lib/architecture-findings-dual-pane";

const nodes = [
  { id: "claims_api", label: "Claims API" },
  { id: "queue", label: "Queue" },
  { id: "analyst", label: "Claims analyst" },
] as const;

describe("architecture-findings-dual-pane SoT", () => {
  it("exports linked layout mode id and Show with findings copy", () => {
    expect(ARCHITECTURE_FINDINGS_DUAL_PANE_LAYOUT_MODE_ID).toBe("architecture-findings-linked");
    expect(ARCHITECTURE_FINDINGS_DUAL_PANE_TOGGLE_ON_LABEL).toBe("Show with findings");
    expect(ARCHITECTURE_FINDINGS_DUAL_PANE_LINKED_VIEW_TITLE).toBe("Linked view");
    expect(isArchitectureFindingsLinkedLayout(resolveArchitectureFindingsDualPaneLayoutMode(true))).toBe(
      true,
    );
    expect(isArchitectureFindingsLinkedLayout(resolveArchitectureFindingsDualPaneLayoutMode(false))).toBe(
      false,
    );
  });

  it("extracts related node ids from finding wire JSON", () => {
    const wire = JSON.stringify({
      relatedNodeIds: ["claims_api", " "],
      graphNodeIdsExamined: ["queue"],
      nodeId: "analyst",
    });

    expect(extractRelatedNodeIdsFromFindingWire(wire)).toEqual(["claims_api", "queue", "analyst"]);
    expect(extractRelatedNodeIdsFromFindingWire("{")).toEqual([]);
    expect(extractRelatedNodeIdsFromFindingWire(null)).toEqual([]);
  });

  it("prefers node-id sync when relatedNodeIds match diagram nodes", () => {
    const sync = resolveFindingDiagramSelectionSync(
      {
        findingId: "f-1",
        title: "Something unrelated",
        relatedNodeIds: ["queue"],
      },
      nodes,
    );

    expect(sync).toEqual({
      findingId: "f-1",
      matchedNodeId: "queue",
      matchedNodeLabel: "Queue",
      matchKind: "node-id",
    });
  });

  it("falls back to title/label heuristic when no node id is available", () => {
    const sync = resolveFindingDiagramSelectionSync(
      {
        findingId: "f-2",
        title: "Harden Claims API authentication",
        wireJson: "{}",
      },
      nodes,
    );

    expect(sync.matchKind).toBe("label-heuristic");
    expect(sync.matchedNodeId).toBe("claims_api");
    expect(formatLinkedComponentStatus(sync)).toContain("Claims API");
  });

  it("returns none when nothing matches", () => {
    const sync = resolveFindingDiagramSelectionSync(
      { findingId: "f-3", title: "Unrelated policy gap" },
      nodes,
    );

    expect(sync.matchKind).toBe("none");
    expect(sync.matchedNodeId).toBeNull();
    expect(formatLinkedComponentStatus(sync)).toMatch(/No matching diagram component/);
  });

  it("builds diagram and findings deep links", () => {
    expect(buildArchitectureFindingsDualPaneDiagramHref("run-1")).toContain("archTab=diagram");
    expect(buildArchitectureFindingsDualPaneFindingsHref("run-1")).toContain("archTab=findings");
  });
});