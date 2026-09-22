import { describe, expect, it } from "vitest";

import { isInfraEvidenceMermaidDiagramEmpty } from "@/lib/infra-evidence/infra-evidence-mermaid-empty-content";

describe("infra-evidence-mermaid-empty-content", () => {
  it("treats zero node metrics as empty", () => {
    expect(isInfraEvidenceMermaidDiagramEmpty("flowchart TD\n  A-->B", 0)).toBe(true);
  });

  it("treats blank mermaid as empty", () => {
    expect(isInfraEvidenceMermaidDiagramEmpty("", null)).toBe(true);
    expect(isInfraEvidenceMermaidDiagramEmpty("   \n  ", undefined)).toBe(true);
  });

  it("treats header-only flowchart as empty", () => {
    expect(isInfraEvidenceMermaidDiagramEmpty("flowchart TD", 1)).toBe(true);
    expect(isInfraEvidenceMermaidDiagramEmpty("flowchart LR\n", 2)).toBe(true);
  });

  it("does not treat drawable mermaid as empty", () => {
    expect(isInfraEvidenceMermaidDiagramEmpty("flowchart TD\n  A-->B", 2)).toBe(false);
  });
});
