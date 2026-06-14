import { describe, expect, it } from "vitest";

import { isMermaidDiagramSource, sanitizeMermaidRenderId } from "@/lib/help-mermaid";

describe("help-mermaid", () => {
  it("detects explicit mermaid fence languages", () => {
    expect(isMermaidDiagramSource("flowchart LR\n  A --> B", "mermaid")).toBe(true);
    expect(isMermaidDiagramSource("flowchart LR\n  A --> B", "mmd")).toBe(true);
  });

  it("detects common mermaid diagram starters without a language tag", () => {
    expect(isMermaidDiagramSource("flowchart LR\n  A --> B")).toBe(true);
    expect(isMermaidDiagramSource("sequenceDiagram\n  A->>B: hi")).toBe(true);
    expect(isMermaidDiagramSource("graph TD\n  A --> B")).toBe(true);
  });

  it("does not treat ordinary code fences as mermaid", () => {
    expect(isMermaidDiagramSource('console.log("hello")', "javascript")).toBe(false);
    expect(isMermaidDiagramSource("SELECT 1", "sql")).toBe(false);
  });

  it("sanitizes render ids", () => {
    expect(sanitizeMermaidRenderId(":r1:help-mermaid-1")).toBe("r1help-mermaid-1");
  });
});
