import { describe, expect, it } from "vitest";

import {
  diagramEvidenceCitationLabel,
  tryParseDiagramEvidenceCitation,
} from "@/lib/findings/diagram-evidence-citation";

describe("diagram-evidence-citation", () => {
  it("parses diagram citation grammar", () => {
    expect(tryParseDiagramEvidenceCitation("diagram:evidence-mermaid-1:api")).toEqual({
      evidenceItemId: "evidence-mermaid-1",
      shapeOrEdgeId: "api",
    });
  });

  it("returns null for non-diagram refs", () => {
    expect(tryParseDiagramEvidenceCitation("doc:architecture.md#L12")).toBeNull();
  });

  it("labels cited shape id without inventing a display name (app-gateway)", () => {
    expect(
      diagramEvidenceCitationLabel({
        evidenceItemId: "evidence-mermaid-1",
        shapeOrEdgeId: "app-gateway",
      }),
    ).toBe("Cited shape id app-gateway. A display name was not stored.");
  });
});
