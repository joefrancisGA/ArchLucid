import { describe, expect, it } from "vitest";

import { createArchitectureDiagramMermaidConfig } from "@/lib/architecture/architecture-diagram-mermaid-config";

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
});
