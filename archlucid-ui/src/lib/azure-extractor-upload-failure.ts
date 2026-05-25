import type { ApiProblemDetails } from "@/lib/api-problem";

import {
  resolveAzureExtractorUploadError,
  type AzureExtractorUploadFailureKind,
} from "@/lib/azure-extractor-upload-error-resolver";

export type { AzureExtractorUploadFailureKind };

export type AzureExtractorUploadFailurePresentation = {
  heading: string;
  guidance: string;
  failureKind: AzureExtractorUploadFailureKind;
  /** UI-facing semantic code derived from API detail + failureKind. */
  errorCode: string;
  /** RFC 9457 extension from the API when present (typically VALIDATION_FAILED). */
  apiErrorCode: string | null;
  docPath: string;
  errors: readonly string[];
  copyPayload: Record<string, unknown>;
};

/**
 * Maps Azure extractor upload Problem Details into operator-facing guidance and a support copy payload.
 */
export function parseAzureExtractorUploadFailure(
  problem: ApiProblemDetails | null,
  fallbackMessage: string,
  correlationId: string | null,
): AzureExtractorUploadFailurePresentation {
  const resolution = resolveAzureExtractorUploadError(problem, fallbackMessage);
  const extensionErrors = problem?.errors ?? [];
  const detail = problem?.detail?.trim() ?? fallbackMessage.trim();
  const errors = extensionErrors.length > 0 ? extensionErrors : detail.length > 0 ? [detail] : [fallbackMessage];
  const apiErrorCode = problem?.errorCode?.trim() ?? null;

  return {
    heading: resolution.heading,
    guidance: resolution.guidance,
    failureKind: resolution.failureKind,
    errorCode: resolution.semanticCode,
    apiErrorCode,
    docPath: resolution.docPath,
    errors,
    copyPayload: {
      status: problem?.status ?? null,
      errorCode: resolution.semanticCode,
      apiErrorCode,
      failureKind: resolution.failureKind,
      detail,
      errors,
      correlationId: correlationId ?? problem?.correlationId ?? null,
    },
  };
}
