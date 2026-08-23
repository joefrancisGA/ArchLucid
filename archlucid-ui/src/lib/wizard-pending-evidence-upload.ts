import type { ApiProblemDetails } from "@/lib/api-problem";
import { readProblemDetailFromBody, tryParseApiProblemDetails } from "@/lib/api-problem";
import { formatApiFailureMessage } from "@/lib/api-error";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { uploadTier1InventoryPackage } from "@/lib/upload-tier1-inventory-package";
import { postBulkEvidenceMultipartWithProgress } from "@/lib/bulk-evidence-upload-client";
import { BULK_EVIDENCE_UPLOAD_FILE_NOT_STORED_REASON } from "@/lib/bulk-evidence-upload-copy";
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

function resolveUploadFailureMessage(status: number, bodyText: string): string {
  const problem = tryParseApiProblemDetails(bodyText, "application/problem+json");

  return formatApiFailureMessage(problem, status, "", bodyText);
}

export async function uploadWizardPendingInventoryEvidence(
  runId: string,
  platform: CloudInventoryPlatform,
  file: File,
  options?: { readonly onUploadProgress?: (percent: number) => void },
): Promise<WizardPendingEvidenceUploadResult> {
  const result = await uploadTier1InventoryPackage(platform, file, {
    runId,
    onUploadProgress: options?.onUploadProgress,
  });

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

/** @deprecated Prefer {@link uploadWizardPendingInventoryEvidence} with an explicit platform. */
export async function uploadWizardPendingAzureEvidence(
  runId: string,
  file: File,
  options?: { readonly onUploadProgress?: (percent: number) => void },
): Promise<WizardPendingEvidenceUploadResult> {
  return uploadWizardPendingInventoryEvidence(runId, "azure", file, options);
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
        BULK_EVIDENCE_UPLOAD_FILE_NOT_STORED_REASON,
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

    const detail = readProblemDetailFromBody(result.bodyText);
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
      message: resolveUploadFailureMessage(result.status, result.bodyText),
      problem: tryParseApiProblemDetails(result.bodyText, "application/problem+json"),
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
