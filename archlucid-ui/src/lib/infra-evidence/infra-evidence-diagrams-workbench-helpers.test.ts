import { describe, expect, it } from "vitest";

import {
  architectureDiagramZoomHrefFromSearch,
  parseArchitectureDiagramZoomFromSearch,
} from "@/lib/architecture/architecture-diagram-fullscreen-url";
import { parseInfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { resolveInfraEvidenceMermaidRenderStatusPresentation } from "@/lib/infra-evidence/infra-evidence-mermaid-render-status-presentation";

describe("parseArchitectureDiagramZoomFromSearch", () => {
  it("parses and clamps zoom values", () => {
    expect(parseArchitectureDiagramZoomFromSearch("1.5")).toBe(1.5);
    expect(parseArchitectureDiagramZoomFromSearch("9")).toBe(2.5);
    expect(parseArchitectureDiagramZoomFromSearch("0.1")).toBe(0.5);
    expect(parseArchitectureDiagramZoomFromSearch(null)).toBeNull();
  });

  it("writes diagZoom to href", () => {
    expect(
      architectureDiagramZoomHrefFromSearch("snapshotId=snap-1", 1.25, "/governance/infrastructure/diagrams"),
    ).toBe("/governance/infrastructure/diagrams?snapshotId=snap-1&diagZoom=1.25");
  });
});

describe("parseInfraEvidenceMermaidOutline", () => {
  it("extracts nodes and edges from a flowchart", () => {
    const outline = parseInfraEvidenceMermaidOutline(`flowchart LR
  A[Alpha] --> B(Beta)
  B --> C`);

    expect(outline.nodes.map((node) => node.id)).toEqual(["A", "B", "C"]);
    expect(outline.edges).toHaveLength(2);
    expect(outline.edges[0]).toEqual({ from: "A", to: "B", label: null });
  });
});

describe("resolveInfraEvidenceMermaidRenderStatusPresentation", () => {
  it("flags succeeded-but-empty renders", () => {
    expect(
      resolveInfraEvidenceMermaidRenderStatusPresentation({ status: "Succeeded", mermaidEmpty: true }).label,
    ).toContain("no diagram content");
  });
});
