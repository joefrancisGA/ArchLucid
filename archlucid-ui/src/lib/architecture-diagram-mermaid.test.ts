import { describe, expect, it } from "vitest";

import { isValidMermaidArchitectureDiagram } from "@/lib/architecture-diagram-mermaid";

describe("isValidMermaidArchitectureDiagram", () => {
  it("accepts flowchart sources and rejects invalid text", () => {
    expect(isValidMermaidArchitectureDiagram('flowchart TB\n  a["A"]')).toBe(true);
    expect(isValidMermaidArchitectureDiagram("not a diagram")).toBe(false);
  });
});
