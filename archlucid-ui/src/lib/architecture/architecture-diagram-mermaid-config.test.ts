import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DIAGRAM_MERMAID_NODE_SPACING,
  ARCHITECTURE_DIAGRAM_MERMAID_PADDING,
  ARCHITECTURE_DIAGRAM_MERMAID_RANK_SPACING,
  ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH,
  createArchitectureDiagramMermaidConfig,
} from "@/lib/architecture/architecture-diagram-mermaid-config";

describe("createArchitectureDiagramMermaidConfig", () => {
  it("uses SVG labels with dark text on pale honey nodes in light mode", () => {
    const config = createArchitectureDiagramMermaidConfig(false);

    expect(config.flowchart.htmlLabels).toBe(false);
    expect(config.suppressErrorRendering).toBe(true);
    expect(config.startOnLoad).toBe(false);
    expect(config.themeVariables.primaryColor).toBe("#E6CF8A");
    expect(config.themeVariables.primaryBorderColor).toBe("#7A6535");
    expect(config.themeVariables.background).toBe("transparent");
    expect(config.themeVariables.primaryTextColor).toBe("#0f172a");
  });

  it.each([false, true])("uses compact linear network-simplex flowchart layout (dark=%s)", (dark) => {
    const config = createArchitectureDiagramMermaidConfig(dark);

    expect(config.flowchart.nodeSpacing).toBe(ARCHITECTURE_DIAGRAM_MERMAID_NODE_SPACING);
    expect(config.flowchart.rankSpacing).toBe(ARCHITECTURE_DIAGRAM_MERMAID_RANK_SPACING);
    expect(config.flowchart.padding).toBe(ARCHITECTURE_DIAGRAM_MERMAID_PADDING);
    expect(config.flowchart.curve).toBe("linear");
    expect(config.flowchart.ranker).toBe("network-simplex");
    expect(config.flowchart.wrappingWidth).toBe(ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH);
    expect(config.flowchart.useMaxWidth).toBe(false);
    expect(config.flowchart.htmlLabels).toBe(false);
  });
});
