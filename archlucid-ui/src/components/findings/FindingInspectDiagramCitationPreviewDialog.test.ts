import { describe, expect, it } from "vitest";

import {
  resolveDiagramEvidenceContentType,
  resolveDiagramEvidenceFileName,
} from "@/components/findings/FindingInspectDiagramCitationPreviewDialog";

describe("FindingInspectDiagramCitationPreviewDialog metadata", () => {
  it("uses omission copy only when diagram metadata is missing", () => {
    expect(resolveDiagramEvidenceFileName(null)).toBe("Diagram file name was not stored.");
    expect(resolveDiagramEvidenceFileName("   ")).toBe("Diagram file name was not stored.");
    expect(resolveDiagramEvidenceFileName("Diagram evidence")).toBe("Diagram evidence");

    expect(resolveDiagramEvidenceContentType(undefined)).toBe("Content type was not stored.");
    expect(resolveDiagramEvidenceContentType("   ")).toBe("Content type was not stored.");
    expect(resolveDiagramEvidenceContentType("text/plain")).toBe("text/plain");
  });
});
