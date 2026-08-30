import { beforeEach, describe, expect, it, vi } from "vitest";

import { extractEvidenceDocumentText } from "@/lib/extract-evidence-document-text";
import { buildIntakeContextDocumentsFromEvidenceFiles } from "@/lib/intake-context-documents-from-files";

vi.mock("@/lib/extract-evidence-document-text", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/extract-evidence-document-text")>();

  return {
    ...actual,
    extractEvidenceDocumentText: vi.fn(),
  };
});

const mockedExtract = vi.mocked(extractEvidenceDocumentText);

describe("buildIntakeContextDocumentsFromEvidenceFiles", () => {
  beforeEach(() => {
    mockedExtract.mockReset();
  });

  it("sends extracted Word text as text/plain under the original file name", async () => {
    mockedExtract.mockResolvedValue({
      ok: true,
      text: "Azure App Service behind Front Door with private endpoints.",
      truncated: false,
    });

    const file = new File(["binary"], "ARCHITECTURE_HANDBOOK.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents).toEqual([
      {
        name: "ARCHITECTURE_HANDBOOK.docx",
        contentType: "text/plain",
        content: "Azure App Service behind Front Door with private endpoints.",
      },
    ]);
  });

  it("includes markdown attachments as text/markdown", async () => {
    const file = new File(["# Brief\n\nMulti-tenant SaaS on Azure."], "architecture-brief.md", {
      type: "text/markdown",
    });
    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([file]);

    expect(documents).toEqual([
      {
        name: "architecture-brief.md",
        contentType: "text/markdown",
        content: "# Brief\n\nMulti-tenant SaaS on Azure.",
      },
    ]);
    expect(mockedExtract).not.toHaveBeenCalled();
  });

  it("skips images and failed extracts", async () => {
    mockedExtract.mockResolvedValue({
      ok: false,
      message: "Could not extract text from the uploaded document.",
    });

    const documents = await buildIntakeContextDocumentsFromEvidenceFiles([
      new File(["x"], "photo.png", { type: "image/png" }),
      new File(["binary"], "empty.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ]);

    expect(documents).toEqual([]);
  });
});
