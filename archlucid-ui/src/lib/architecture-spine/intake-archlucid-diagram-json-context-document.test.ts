import { describe, expect, it } from "vitest";

import {
  isArchLucidDiagramJsonIntakeFileName,
  looksLikeArchLucidDiagramJson,
  STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE,
} from "@/lib/architecture-spine/intake-archlucid-diagram-json-context-document";

describe("intake-archlucid-diagram-json-context-document", () => {
  it("recognizes .diagram.json file names", () => {
    expect(isArchLucidDiagramJsonIntakeFileName("topology.diagram.json")).toBe(true);
    expect(isArchLucidDiagramJsonIntakeFileName("manifest.json")).toBe(false);
  });

  it("detects native diagram JSON and rejects pixel stubs", () => {
    const native = JSON.stringify({
      nodes: [{ id: "api", label: "API Gateway", kind: "system" }],
      edges: [],
      trustBoundaryLabels: [],
      extractionMethod: "StructuredParse",
    });

    expect(looksLikeArchLucidDiagramJson(native)).toBe(true);
    expect(looksLikeArchLucidDiagramJson(JSON.stringify({
      nodes: [],
      edges: [],
      intakeStub: { kind: "pixel-diagram-not-verifiable", sourceMimeType: "image/png" },
    }))).toBe(false);
    expect(looksLikeArchLucidDiagramJson('{"resources":[]}')).toBe(false);
  });

  it("exports the structured diagram MIME type constant", () => {
    expect(STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE).toBe("application/vnd.archlucid.diagram+json");
  });
});
