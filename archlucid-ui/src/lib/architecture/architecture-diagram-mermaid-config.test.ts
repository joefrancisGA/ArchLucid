import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE,
  ARCHITECTURE_DIAGRAM_MERMAID_NODE_SPACING,
  ARCHITECTURE_DIAGRAM_MERMAID_PADDING,
  ARCHITECTURE_DIAGRAM_MERMAID_RANK_SPACING,
  ARCHITECTURE_DIAGRAM_MERMAID_SUBGRAPH_TITLE_TOP_MARGIN,
  ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH,
  createArchitectureDiagramMermaidConfig,
} from "@/lib/architecture/architecture-diagram-mermaid-config";

describe("createArchitectureDiagramMermaidConfig", () => {
  it("uses SVG labels with dark text on neutral nodes in light mode", () => {
    const config = createArchitectureDiagramMermaidConfig(false);

    expect(config.flowchart.htmlLabels).toBe(false);
    expect(config.flowchart.padding).toBe(10);
    expect(config.flowchart.nodeSpacing).toBe(24);
    expect(config.flowchart.rankSpacing).toBe(36);
    expect(config.flowchart.subGraphTitleMargin.top).toBe(
      ARCHITECTURE_DIAGRAM_MERMAID_SUBGRAPH_TITLE_TOP_MARGIN,
    );
    expect(config.suppressErrorRendering).toBe(true);
    expect(config.startOnLoad).toBe(false);
    expect(config.themeVariables.primaryColor).toBe(ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.fill);
    expect(config.themeVariables.primaryBorderColor).toBe(ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.border);
    expect(config.themeVariables.lineColor).toBe(ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.edge);
    expect(config.themeVariables.background).toBe("transparent");
    expect(config.themeVariables.primaryTextColor).toBe("#0f172a");
  });

  it.each([false, true])("uses compact linear flowchart layout without a no-op ranker (dark=%s)", (dark) => {
    const config = createArchitectureDiagramMermaidConfig(dark);

    expect(config.flowchart.nodeSpacing).toBe(ARCHITECTURE_DIAGRAM_MERMAID_NODE_SPACING);
    expect(config.flowchart.rankSpacing).toBe(ARCHITECTURE_DIAGRAM_MERMAID_RANK_SPACING);
    expect(config.flowchart.padding).toBe(ARCHITECTURE_DIAGRAM_MERMAID_PADDING);
    expect(config.flowchart.curve).toBe("linear");
    expect(config.flowchart).not.toHaveProperty("ranker");
    expect(config.flowchart.wrappingWidth).toBe(ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH);
    expect(config.flowchart.useMaxWidth).toBe(false);
    expect(config.flowchart.htmlLabels).toBe(false);
  });
});
