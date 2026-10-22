import { describe, expect, it } from "vitest";

import {
  buildIntakePixelDiagramContextDocument,
  buildIntakePendingStoredFileMarker,
  INTAKE_PIXEL_DIAGRAM_EXTRACTION_METHOD_NONE,
  INTAKE_PIXEL_DIAGRAM_VERIFICATION_STATUS_NOT_VERIFIABLE,
  isPixelDiagramIntakeFileName,
  parseIntakePixelDiagramContextStub,
} from "@/lib/architecture-spine/intake-pixel-diagram-context-document";
import { STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE } from "@/lib/architecture-spine/supported-context-document-content-types";
import { buildIntakeContextDocumentsFromEvidenceFiles } from "@/lib/intake-context-documents-from-files";

describe("intake pixel diagram context document (AS-004)", () => {
  it("detects png and jpeg file names", () => {
    expect(isPixelDiagramIntakeFileName("topology.png")).toBe(true);
    expect(isPixelDiagramIntakeFileName("photo.JPG")).toBe(true);
    expect(isPixelDiagramIntakeFileName("brief.md")).toBe(false);
  });

  it("builds a structured diagram stub without raster bytes in content", () => {
    const file = new File([new Uint8Array([137, 80, 78, 71])], "topology.png", { type: "image/png" });
    const document = buildIntakePixelDiagramContextDocument("topology.png", file);

    expect(document.contentType).toBe(STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE);
    expect(document.content).not.toContain("iVBOR");
    expect(document.content).not.toMatch(/[^\x20-\x7E\n\r\t]/);

    const stub = parseIntakePixelDiagramContextStub(document.content);

    expect(stub?.intakeStub.extractionMethod).toBe(INTAKE_PIXEL_DIAGRAM_EXTRACTION_METHOD_NONE);
    expect(stub?.intakeStub.verificationStatus).toBe(INTAKE_PIXEL_DIAGRAM_VERIFICATION_STATUS_NOT_VERIFIABLE);
    expect(stub?.intakeStub.pendingStoredFileMarker).toBe(buildIntakePendingStoredFileMarker("topology.png"));
    expect(stub?.nodes).toEqual([]);
  });

  it("wires evidenceItemId when the ESI catalog id is already known", () => {
    const file = new File(["jpeg-bytes"], "diagram.jpeg", { type: "image/jpeg" });
    const document = buildIntakePixelDiagramContextDocument("diagram.jpeg", file, {
      evidenceItemId: "evidence-item-42",
    });
    const stub = parseIntakePixelDiagramContextStub(document.content);

    expect(stub?.intakeStub.evidenceItemId).toBe("evidence-item-42");
    expect(stub?.intakeStub.pendingStoredFileMarker).toBeNull();
  });
});

describe("buildIntakeContextDocumentsFromEvidenceFiles pixel honesty (AS-004)", () => {
  it("returns a NotVerifiable diagram stub for a non-empty PNG instead of an empty list", async () => {
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([
      new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" }),
    ]);

    expect(documents).toHaveLength(1);
    expect(documents[0]?.contentType).toBe(STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE);

    const stub = parseIntakePixelDiagramContextStub(documents[0]!.content);

    expect(stub?.intakeStub.verificationStatus).toBe(INTAKE_PIXEL_DIAGRAM_VERIFICATION_STATUS_NOT_VERIFIABLE);
  });

  it("forwards stored evidence ids by file name when provided", async () => {
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles(
      [new File(["bytes"], "diagram.png", { type: "image/png" })],
      { storedEvidenceIdsByFileName: { "diagram.png": "ev-99" } },
    );

    const stub = parseIntakePixelDiagramContextStub(documents[0]!.content);

    expect(stub?.intakeStub.evidenceItemId).toBe("ev-99");
  });

  it("skips empty pixel files", async () => {
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([
      new File([], "empty.png", { type: "image/png" }),
    ]);

    expect(documents).toEqual([]);
  });
});
