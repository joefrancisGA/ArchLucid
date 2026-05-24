import type { ApiProblemDetails } from "@/lib/api-problem";

export type AzureExtractorUploadFailureKind = "schema" | "archive" | "validation" | "unknown";

export type AzureExtractorUploadFailurePresentation = {
  heading: string;
  guidance: string;
  failureKind: AzureExtractorUploadFailureKind;
  errors: readonly string[];
  copyPayload: Record<string, unknown>;
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

  return "unknown";
}

function guidanceForFailureKind(kind: AzureExtractorUploadFailureKind, detail: string): string {
  if (kind === "schema") {
    if (detail.toLowerCase().includes("unsupported manifest schemaversion")) {
      return "Re-run Get-ArchLucidAzurePackage.ps1 from the current CDN script so manifest.json uses a supported schemaVersion, then upload the new ZIP.";
    }

    if (detail.toLowerCase().includes("missing manifest.json")) {
      return "The ZIP must contain manifest.json at the archive root. Re-run the extractor script and upload the complete package.";
    }

    if (detail.toLowerCase().includes("valid json")) {
      return "manifest.json is not valid JSON. Re-run the extractor locally and confirm the file opens cleanly before uploading.";
    }

    return "Fix manifest.json (schemaVersion and required fields) using the current extractor script output, then upload again.";
  }

  if (kind === "archive") {
    return "Upload a complete .zip produced by Get-ArchLucidAzurePackage.ps1. Partial downloads or renamed folders often fail archive validation.";
  }

  if (kind === "validation") {
    return "Review the validation messages below, correct the extractor package, and retry the upload.";
  }

  return "Review the error detail, fix the extractor package, and retry. Include the copied error details when opening a support ticket.";
}

/**
 * Maps Azure extractor upload Problem Details into operator-facing guidance and a support copy payload.
 */
export function parseAzureExtractorUploadFailure(
  problem: ApiProblemDetails | null,
  fallbackMessage: string,
  correlationId: string | null,
): AzureExtractorUploadFailurePresentation {
  const failureKind = readFailureKind(problem);
  const extensionErrors = problem?.errors ?? [];
  const detail = problem?.detail?.trim() ?? fallbackMessage.trim();
  const errors = extensionErrors.length > 0 ? extensionErrors : detail.length > 0 ? [detail] : [fallbackMessage];

  const heading =
    failureKind === "schema"
      ? "Extractor manifest rejected"
      : failureKind === "archive"
        ? "Invalid ZIP archive"
        : "Azure extractor upload failed";

  return {
    heading,
    guidance: guidanceForFailureKind(failureKind, detail),
    failureKind,
    errors,
    copyPayload: {
      status: problem?.status ?? null,
      errorCode: problem?.errorCode ?? null,
      failureKind,
      detail,
      errors,
      correlationId: correlationId ?? problem?.correlationId ?? null,
    },
  };
}
