import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_NOT_STORED,
  ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_STORED_EMPTY,
  INVENTORY_DIAGRAM_MERMAID_STORED_EMPTY,
  formatArchitectureDiagramMermaidSourceForDisclosure,
} from "@/lib/architecture/format-architecture-diagram-mermaid-source-display";

describe("format-architecture-diagram-mermaid-source-display (P-06/P-12)", () => {
  it("labels omitted, empty, and header-only mermaid sources", () => {
    expect(formatArchitectureDiagramMermaidSourceForDisclosure(null)).toBe(
      ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_NOT_STORED,
    );
    expect(formatArchitectureDiagramMermaidSourceForDisclosure("")).toBe(
      ARCHITECTURE_DIAGRAM_MERMAID_SOURCE_STORED_EMPTY,
    );
    expect(formatArchitectureDiagramMermaidSourceForDisclosure("flowchart TB\n")).toBe(
      INVENTORY_DIAGRAM_MERMAID_STORED_EMPTY,
    );
    expect(formatArchitectureDiagramMermaidSourceForDisclosure("flowchart TB\n  a-->b")).toBe(
      "flowchart TB\n  a-->b",
    );
  });
});
