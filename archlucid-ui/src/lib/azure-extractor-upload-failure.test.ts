import { describe, expect, it } from "vitest";

import { resolveAzureExtractorUploadError } from "@/lib/azure-extractor-upload-error-resolver";
import { parseAzureExtractorUploadFailure } from "@/lib/azure-extractor-upload-failure";

describe("resolveAzureExtractorUploadError", () => {
  it("maps unsupported schemaVersion to AZURE_EXTRACTOR_UNSUPPORTED_SCHEMA_VERSION", () => {
    const resolution = resolveAzureExtractorUploadError(
      {
        detail: "Unsupported manifest schemaVersion: 99.",
        failureKind: "schema",
        errorCode: "VALIDATION_FAILED",
      },
      "Upload failed",
    );

    expect(resolution.semanticCode).toBe("AZURE_EXTRACTOR_UNSUPPORTED_SCHEMA_VERSION");
    expect(resolution.guidance).toContain("supported schemaVersion");
    expect(resolution.docPath).toContain("AZURE_EXTRACTOR.md");
  });

  it("maps missing manifest.json to AZURE_EXTRACTOR_MISSING_MANIFEST", () => {
    const resolution = resolveAzureExtractorUploadError(
      { detail: "ZIP does not contain manifest.json." },
      "Upload failed",
    );

    expect(resolution.semanticCode).toBe("AZURE_EXTRACTOR_MISSING_MANIFEST");
    expect(resolution.failureKind).toBe("schema");
    expect(resolution.guidance).toContain("manifest.json");
  });

  it("maps corrupt ZIP archives to AZURE_EXTRACTOR_INVALID_ZIP_ARCHIVE", () => {
    const resolution = resolveAzureExtractorUploadError(
      {
        detail: "Uploaded payload is not a valid ZIP archive.",
        failureKind: "archive",
        errorCode: "VALIDATION_FAILED",
      },
      "Upload failed",
    );

    expect(resolution.semanticCode).toBe("AZURE_EXTRACTOR_INVALID_ZIP_ARCHIVE");
    expect(resolution.heading).toBe("Invalid ZIP archive");
  });

  it("maps missing resources.json to AZURE_EXTRACTOR_MISSING_RESOURCES_JSON", () => {
    const resolution = resolveAzureExtractorUploadError(
      {
        detail: "ZIP does not contain resources.json (required extractor output).",
        failureKind: "validation",
        errorCode: "VALIDATION_FAILED",
      },
      "Upload failed",
    );

    expect(resolution.semanticCode).toBe("AZURE_EXTRACTOR_MISSING_RESOURCES_JSON");
    expect(resolution.docPath).toContain("AZURE_EXTRACTOR.md");
  });

  it("maps run scope mismatch to ingest runbook guidance", () => {
    const resolution = resolveAzureExtractorUploadError(
      {
        detail: "Run id is not recognized in this workspace scope.",
        failureKind: "validation",
        errorCode: "VALIDATION_FAILED",
      },
      "Upload failed",
    );

    expect(resolution.semanticCode).toBe("AZURE_EXTRACTOR_RUN_SCOPE_MISMATCH");
    expect(resolution.docPath).toContain("AZURE_EXTRACTOR_INGEST.md");
  });
});

describe("parseAzureExtractorUploadFailure", () => {
  it("surfaces semantic and API error codes in the copy payload", () => {
    const presentation = parseAzureExtractorUploadFailure(
      {
        detail: "Unsupported manifest schemaVersion: 1.0.",
        failureKind: "schema",
        errorCode: "VALIDATION_FAILED",
        errors: ["Unsupported manifest schemaVersion: 1.0."],
      },
      "Upload failed",
      "corr-1",
    );

    expect(presentation.errorCode).toBe("AZURE_EXTRACTOR_UNSUPPORTED_SCHEMA_VERSION");
    expect(presentation.apiErrorCode).toBe("VALIDATION_FAILED");
    expect(presentation.copyPayload.correlationId).toBe("corr-1");
    expect(presentation.docPath).toContain("AZURE_EXTRACTOR.md");
  });
});
