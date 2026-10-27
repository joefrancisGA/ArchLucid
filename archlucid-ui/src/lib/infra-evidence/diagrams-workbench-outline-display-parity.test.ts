import { describe, expect, it } from "vitest";

import { normalizeInfraEvidenceMermaidSourceForDisplay } from "@/lib/infra-evidence/normalize-infra-evidence-mermaid-display";
import { parseInfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

describe("diagrams workbench outline display parity", () => {
  it("lowercases edge labels in display mermaid so outline must parse display source for family filtering", () => {
    const raw =
      'flowchart LR\n  a -->|"May access MyStorageAcct"| b';
    const display = normalizeInfraEvidenceMermaidSourceForDisplay(raw);
    const rawLabel = parseInfraEvidenceMermaidOutline(raw).edges[0]?.label ?? "";
    const displayLabel = parseInfraEvidenceMermaidOutline(display).edges[0]?.label ?? "";

    expect(displayLabel).not.toBe(rawLabel);
    expect(displayLabel).toBe(displayLabel.toLowerCase());
  });
});
