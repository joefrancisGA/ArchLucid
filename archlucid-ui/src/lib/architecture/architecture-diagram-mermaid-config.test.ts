import { describe, expect, it } from "vitest";

import { createArchitectureDiagramMermaidConfig } from "@/lib/architecture/architecture-diagram-mermaid-config";

describe("createArchitectureDiagramMermaidConfig", () => {
  it("uses SVG labels with dark text on a white node fill in light mode", () => {
    const config = createArchitectureDiagramMermaidConfig(false);

    expect(config.flowchart.htmlLabels).toBe(false);
    expect(config.themeVariables.primaryColor).toBe("#ffffff");
    expect(config.themeVariables.primaryTextColor).toBe("#0f172a");
  });
});
