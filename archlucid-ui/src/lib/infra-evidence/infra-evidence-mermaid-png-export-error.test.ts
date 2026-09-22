import { describe, expect, it } from "vitest";

import {
  INFRA_EVIDENCE_MERMAID_PNG_TAINTED_CANVAS_MESSAGE,
  formatInfraEvidenceMermaidPngExportError,
} from "@/lib/infra-evidence/infra-evidence-mermaid-png-export-error";

describe("formatInfraEvidenceMermaidPngExportError", () => {
  it("maps tainted canvas failures to operator-friendly copy", () => {
    const message = formatInfraEvidenceMermaidPngExportError(
      new Error("Failed to execute 'toBlob' on 'HTMLCanvasElement': Tainted canvases may not be exported."),
    );

    expect(message).toBe(INFRA_EVIDENCE_MERMAID_PNG_TAINTED_CANVAS_MESSAGE);
  });

  it("returns null for unrelated errors", () => {
    expect(formatInfraEvidenceMermaidPngExportError(new Error("Network failed"))).toBeNull();
  });
});
