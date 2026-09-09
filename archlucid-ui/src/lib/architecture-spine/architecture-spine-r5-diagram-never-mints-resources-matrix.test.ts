import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildIntakePixelDiagramContextStub,
  parseIntakePixelDiagramContextStub,
} from "@/lib/architecture-spine/intake-pixel-diagram-context-document";
import { buildIntakeContextDocumentsFromEvidenceFiles } from "@/lib/intake-context-documents-from-files";
import { extractEvidenceDocumentText } from "@/lib/extract-evidence-document-text";

vi.mock("@/lib/extract-evidence-document-text", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/extract-evidence-document-text")>();

  return {
    ...actual,
    extractEvidenceDocumentText: vi.fn(),
  };
});

const mockedExtract = vi.mocked(extractEvidenceDocumentText);

type R5MatrixCase = {
  readonly caseName: string;
  readonly run: () => Promise<void> | void;
};

/** AS-045 / R5 matrix — cited by AS-100 wave close audit. */
const AS045_R5_MATRIX_CASES: readonly R5MatrixCase[] = [
  {
    caseName: "pixel_png_stub_has_zero_topology_nodes",
    run: () => {
      const stub = buildIntakePixelDiagramContextStub({
        sourceMimeType: "image/png",
        evidenceItemId: null,
        pendingStoredFileMarker: "pending-stored-file:topology.png",
      });

      expect(stub.nodes).toHaveLength(0);
      expect(stub.intakeStub.verificationStatus).toBe("NotVerifiable");
      expect(parseIntakePixelDiagramContextStub(JSON.stringify(stub))?.nodes).toHaveLength(0);
    },
  },
  {
    caseName: "pixel_png_intake_emits_not_verifiable_stub_not_text_plain",
    run: async () => {
      const documents = await buildIntakeContextDocumentsFromEvidenceFiles([
        new File([new Uint8Array([1, 2, 3])], "topology.png", { type: "image/png" }),
      ]);

      expect(documents).toHaveLength(1);
      expect(documents[0]?.contentType).toBe("application/vnd.archlucid.diagram+json");
      expect(documents[0]?.content).toMatch(/"verificationStatus":"NotVerifiable"/);
      expect(documents[0]?.content).toMatch(/"nodes":\[\]/);
      expect(documents[0]?.contentType).not.toBe("text/plain");
    },
  },
  {
    caseName: "empty_pdf_extract_does_not_emit_blank_text_plain_brief",
    run: async () => {
      mockedExtract.mockResolvedValue({
        ok: false,
        message: "No extractable text was returned for this document.",
      });

      const documents = await buildIntakeContextDocumentsFromEvidenceFiles([
        new File(["binary"], "scanned-architecture.pdf", { type: "application/pdf" }),
      ]);

      expect(documents).toHaveLength(0);
      expect(mockedExtract).toHaveBeenCalledTimes(1);
    },
  },
];

describe("architecture spine R5 diagram never mints resources matrix (AS-045)", () => {
  beforeEach(() => {
    mockedExtract.mockReset();
  });

  it.each(AS045_R5_MATRIX_CASES)("$caseName", async ({ run }) => {
    await run();
  });
});
