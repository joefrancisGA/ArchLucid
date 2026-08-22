import { describe, expect, it, vi, beforeEach } from "vitest";

import { extractEvidenceDocumentText } from "@/lib/extract-evidence-document-text";
import { buildArchitectureIntakeInferenceCorpus } from "@/lib/evidence-readable-text";

vi.mock("@/lib/extract-evidence-document-text", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/extract-evidence-document-text")>();

  return {
    ...actual,
    extractEvidenceDocumentText: vi.fn(),
  };
});

const mockedExtract = vi.mocked(extractEvidenceDocumentText);

describe("buildArchitectureIntakeInferenceCorpus", () => {
  beforeEach(() => {
    mockedExtract.mockReset();
  });

  it("includes API-extracted PDF text in the inference corpus", async () => {
    mockedExtract.mockResolvedValue({
      ok: true,
      text: "Microsoft Azure PCI-DSS scope with a $25,000 monthly budget.",
      truncated: false,
    });

    const file = new File(["binary"], "architecture-handbook.pdf", { type: "application/pdf" });
    const corpus = await buildArchitectureIntakeInferenceCorpus({
      briefText: "",
      evidenceFiles: [file],
    });

    expect(mockedExtract).toHaveBeenCalledWith(file);
    expect(corpus).toContain("Microsoft Azure");
    expect(corpus).toContain("architecture handbook pdf");
  });
});
