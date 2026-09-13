import { describe, expect, it } from "vitest";

import { ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH } from "@/lib/architecture/architecture-diagram-mermaid-config";
import {
  ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX,
  estimateArchitectureDiagramLabelWidthPx,
  wrapArchitectureDiagramLabelForMermaidSource,
  wrapArchitectureDiagramLabelToWidth,
  wrapWidthInsideNodeRectPx,
} from "@/lib/architecture/wrap-architecture-diagram-label";

describe("wrapArchitectureDiagramLabelToWidth", () => {
  it("keeps short names on one line", () => {
    const lines = wrapArchitectureDiagramLabelToWidth("vnet-eastus", 240);

    expect(lines).toEqual(["vnet-eastus"]);
  });

  it("wraps Azure product names that overrun a wrappingWidth node box", () => {
    const wrapWidth = wrapWidthInsideNodeRectPx(ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH);
    const lines = wrapArchitectureDiagramLabelToWidth(
      "Azure Kubernetes Service (AKS) Cluster",
      wrapWidth,
    );

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe("Azure Kubernetes Service (AKS) Cluster");

    for (const line of lines) {
      expect(estimateArchitectureDiagramLabelWidthPx(line)).toBeLessThanOrEqual(wrapWidth + 1);
    }
  });

  it("breaks hyphenated resource ids instead of overflowing", () => {
    const wrapWidth = wrapWidthInsideNodeRectPx(160);
    const lines = wrapArchitectureDiagramLabelToWidth(
      "vnet-eastus-hub-shared-connectivity-001",
      wrapWidth,
      ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX,
    );

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join("").replace(/ /g, "")).toContain("vnet-eastus");
  });

  it("returns no lines for empty input", () => {
    expect(wrapArchitectureDiagramLabelToWidth("   ", 240)).toEqual([]);
  });
});

describe("wrapArchitectureDiagramLabelForMermaidSource", () => {
  it("emits mermaid \\n so layout allocates height before SVG sanitize", () => {
    const mermaidLabel = wrapArchitectureDiagramLabelForMermaidSource(
      "Azure Kubernetes Service (AKS) Cluster",
    );

    expect(mermaidLabel).toContain("\\n");
    expect(mermaidLabel).not.toContain("\n");
  });

  it("does not insert breaks for names that already fit", () => {
    expect(wrapArchitectureDiagramLabelForMermaidSource("Claims API")).toBe("Claims API");
  });
});
