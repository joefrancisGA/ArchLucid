import { describe, expect, it } from "vitest";

import { parseAzureExtractorUploadFailure } from "@/lib/azure-extractor-upload-failure";

describe("parseAzureExtractorUploadFailure", () => {
  it("maps unsupported schemaVersion to schema guidance", () => {
    const presentation = parseAzureExtractorUploadFailure(
      {
        detail: "Unsupported manifest schemaVersion: 1.0.",
        failureKind: "schema",
        errors: ["Unsupported manifest schemaVersion: 1.0."],
      },
      "Upload failed",
      "corr-1",
    );

    expect(presentation.failureKind).toBe("schema");
    expect(presentation.guidance).toContain("supported schemaVersion");
    expect(presentation.copyPayload.correlationId).toBe("corr-1");
  });

  it("maps missing manifest guidance from detail text", () => {
    const presentation = parseAzureExtractorUploadFailure(
      { detail: "ZIP does not contain manifest.json." },
      "Upload failed",
      null,
    );

    expect(presentation.failureKind).toBe("schema");
    expect(presentation.guidance).toContain("manifest.json");
  });
});
