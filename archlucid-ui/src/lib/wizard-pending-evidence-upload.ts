import type { ApiProblemDetails } from "@/lib/api-problem";
import { uploadAzureExtractorPackage } from "@/lib/upload-azure-extractor-package";
import { postBulkEvidenceMultipartWithProgress } from "@/lib/bulk-evidence-upload-client";
import {
  buildBulkEvidenceUploadSummary,
  parsePartialUploadCountFromDetail,
  parseSuccessUploadedCount,
} from "@/lib/bulk-evidence-upload-outcome";

export type WizardPendingEvidenceUploadResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      problem: ApiProblemDetails | null;
      correlationId: string | null;
    };

function parseProblemDetail(bodyText: string): string | undefined {
  try {
    const problem = JSON.parse(bodyText) as { detail?: string };

    return typeof problem.detail === "string" ? problem.detail : undefined;
  } catch {
    return undefined;
  }
}

export async function uploadWizardPendingAzureEvidence(
  runId: string,
  file: File,
): Promise<WizardPendingEvidenceUploadResult> {
  const result = await uploadAzureExtractorPackage(file, { runId });

  if (result.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    message: result.message,
    problem: result.problem,
    correlationId: result.correlationId,
  };
}

export async function uploadWizardPendingDocumentEvidence(
  runId: string,
  files: File[],
): Promise<WizardPendingEvidenceUploadResult> {
  if (files.length === 0) {
    return { ok: true };
  }

  try {
    const result = await postBulkEvidenceMultipartWithProgress(runId, files, () => {
      /* wizard track step does not surface per-file progress yet */
    });

    if (result.status >= 200 && result.status < 300) {
      const uploadedNonEmptyCount = parseSuccessUploadedCount(result.bodyText);
      const summary = buildBulkEvidenceUploadSummary(
        files,
        uploadedNonEmptyCount,
        "Not stored by server",
        "Evidence successfully uploaded.",
      );

      if (summary.failedCount > 0) {
        return {
          ok: false,
          message: summary.message,
          problem: null,
          correlationId: null,
        };
      }

      return { ok: true };
    }

    const detail = parseProblemDetail(result.bodyText);
    const partialUploaded = parsePartialUploadCountFromDetail(detail);

    if (partialUploaded !== null && partialUploaded > 0) {
      const summary = buildBulkEvidenceUploadSummary(
        files,
        partialUploaded,
        detail ?? "Upload failed",
        "Upload partially completed.",
      );

      return {
        ok: false,
        message: summary.message,
        problem: null,
        correlationId: null,
      };
    }

    return {
      ok: false,
      message: detail ?? "Document evidence upload failed.",
      problem: null,
      correlationId: null,
    };
  } catch {
    return {
      ok: false,
      message: "Document evidence upload failed.",
      problem: null,
      correlationId: null,
    };
  }
}
