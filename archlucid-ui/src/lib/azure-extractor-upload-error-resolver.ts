import type { ApiProblemDetails } from "@/lib/api-problem";

export type AzureExtractorUploadFailureKind = "schema" | "archive" | "validation" | "unknown";

export const AZURE_EXTRACTOR_UPLOAD_DOC_PATHS = {
  primary: "/docs/library/AZURE_EXTRACTOR.md",
  ingestRunbook: "/docs/runbooks/AZURE_EXTRACTOR_INGEST.md",
} as const;

export type AzureExtractorUploadSemanticCode =
  | "AZURE_EXTRACTOR_UNSUPPORTED_SCHEMA_VERSION"
  | "AZURE_EXTRACTOR_MISSING_MANIFEST"
  | "AZURE_EXTRACTOR_INVALID_MANIFEST_JSON"
  | "AZURE_EXTRACTOR_MISSING_SCHEMA_VERSION"
  | "AZURE_EXTRACTOR_MISSING_RESOURCES_JSON"
  | "AZURE_EXTRACTOR_INVALID_ZIP_ARCHIVE"
  | "AZURE_EXTRACTOR_RUN_SCOPE_MISMATCH"
  | "AZURE_EXTRACTOR_ZIP_TOO_LARGE"
  | "AZURE_EXTRACTOR_NO_FILE_UPLOADED"
  | "AZURE_EXTRACTOR_UPLOAD_UNKNOWN";

export type AzureExtractorUploadErrorResolution = {
  semanticCode: AzureExtractorUploadSemanticCode;
  failureKind: AzureExtractorUploadFailureKind;
  heading: string;
  guidance: string;
  docPath: string;
};

function readFailureKind(problem: ApiProblemDetails | null): AzureExtractorUploadFailureKind {
  const raw = problem?.failureKind;

  if (raw === "schema" || raw === "archive" || raw === "validation") {
    return raw;
  }

  const detail = problem?.detail?.toLowerCase() ?? "";

  if (detail.includes("schemaversion") || detail.includes("manifest.json")) {
    return "schema";
  }

  if (detail.includes("zip") || detail.includes("archive")) {
    return "archive";
  }

  if (detail.includes("run id") || detail.includes("resources.json") || detail.includes("maximum size")) {
    return "validation";
  }

  return "unknown";
}

function resolveSemanticCode(detail: string, failureKind: AzureExtractorUploadFailureKind): AzureExtractorUploadSemanticCode {
  const normalized = detail.toLowerCase();

  if (normalized.includes("unsupported manifest schemaversion")) {
    return "AZURE_EXTRACTOR_UNSUPPORTED_SCHEMA_VERSION";
  }

  if (normalized.includes("does not contain manifest.json")) {
    return "AZURE_EXTRACTOR_MISSING_MANIFEST";
  }

  if (normalized.includes("not valid json")) {
    return "AZURE_EXTRACTOR_INVALID_MANIFEST_JSON";
  }

  if (normalized.includes("schemaversion") && normalized.includes("missing")) {
    return "AZURE_EXTRACTOR_MISSING_SCHEMA_VERSION";
  }

  if (normalized.includes("does not contain resources.json")) {
    return "AZURE_EXTRACTOR_MISSING_RESOURCES_JSON";
  }

  if (normalized.includes("not a valid zip archive")) {
    return "AZURE_EXTRACTOR_INVALID_ZIP_ARCHIVE";
  }

  if (normalized.includes("run id is not recognized")) {
    return "AZURE_EXTRACTOR_RUN_SCOPE_MISMATCH";
  }

  if (normalized.includes("exceeds maximum size")) {
    return "AZURE_EXTRACTOR_ZIP_TOO_LARGE";
  }

  if (normalized.includes("no file uploaded")) {
    return "AZURE_EXTRACTOR_NO_FILE_UPLOADED";
  }

  if (failureKind === "schema") {
    return "AZURE_EXTRACTOR_MISSING_SCHEMA_VERSION";
  }

  if (failureKind === "archive") {
    return "AZURE_EXTRACTOR_INVALID_ZIP_ARCHIVE";
  }

  return "AZURE_EXTRACTOR_UPLOAD_UNKNOWN";
}

function guidanceForSemanticCode(code: AzureExtractorUploadSemanticCode): string {
  switch (code) {
    case "AZURE_EXTRACTOR_UNSUPPORTED_SCHEMA_VERSION":
      return "Re-run Get-ArchLucidAzurePackage.ps1 from the current CDN script so manifest.json uses a supported schemaVersion, then upload the new ZIP.";
    case "AZURE_EXTRACTOR_MISSING_MANIFEST":
      return "The ZIP must contain manifest.json at the archive root. Re-run the extractor script and upload the complete package.";
    case "AZURE_EXTRACTOR_INVALID_MANIFEST_JSON":
      return "manifest.json is not valid JSON. Re-run the extractor locally and confirm the file opens cleanly before uploading.";
    case "AZURE_EXTRACTOR_MISSING_SCHEMA_VERSION":
      return "manifest.json must include schemaVersion 1. Download the latest extractor script and regenerate the ZIP.";
    case "AZURE_EXTRACTOR_MISSING_RESOURCES_JSON":
      return "The ZIP must include resources.json from Get-ArchLucidAzurePackage.ps1. Do not upload a manifest-only archive.";
    case "AZURE_EXTRACTOR_INVALID_ZIP_ARCHIVE":
      return "Upload a complete .zip produced by Get-ArchLucidAzurePackage.ps1. Partial downloads or renamed folders often fail archive validation.";
    case "AZURE_EXTRACTOR_RUN_SCOPE_MISMATCH":
      return "The runId query parameter does not match a review in this workspace. Upload without runId or open the correct workspace scope first.";
    case "AZURE_EXTRACTOR_ZIP_TOO_LARGE":
      return "Reduce extractor scope (subscription or resource group) or use chunked upload when enabled. Confirm the ZIP is within the server size limit.";
    case "AZURE_EXTRACTOR_NO_FILE_UPLOADED":
      return "Select a .zip file in the upload control. The multipart form field must be named file.";
    default:
      return "Review the error detail, fix the extractor package, and retry. Include the copied error details when opening a support ticket.";
  }
}

function headingForFailureKind(failureKind: AzureExtractorUploadFailureKind): string {
  if (failureKind === "schema") {
    return "Extractor manifest rejected";
  }

  if (failureKind === "archive") {
    return "Invalid ZIP archive";
  }

  return "Azure extractor upload failed";
}

function docPathForSemanticCode(code: AzureExtractorUploadSemanticCode): string {
  if (
    code === "AZURE_EXTRACTOR_RUN_SCOPE_MISMATCH" ||
    code === "AZURE_EXTRACTOR_ZIP_TOO_LARGE" ||
    code === "AZURE_EXTRACTOR_NO_FILE_UPLOADED"
  ) {
    return AZURE_EXTRACTOR_UPLOAD_DOC_PATHS.ingestRunbook;
  }

  return AZURE_EXTRACTOR_UPLOAD_DOC_PATHS.primary;
}

/** Maps Problem Details from extractor upload endpoints into semantic codes and remediation copy. */
export function resolveAzureExtractorUploadError(
  problem: ApiProblemDetails | null,
  fallbackMessage: string,
): AzureExtractorUploadErrorResolution {
  const failureKind = readFailureKind(problem);
  const detail = problem?.detail?.trim() ?? fallbackMessage.trim();
  const semanticCode = resolveSemanticCode(detail, failureKind);

  return {
    semanticCode,
    failureKind,
    heading: headingForFailureKind(failureKind),
    guidance: guidanceForSemanticCode(semanticCode),
    docPath: docPathForSemanticCode(semanticCode),
  };
}
