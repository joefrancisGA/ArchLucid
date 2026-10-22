import {
  AZURE_CONNECTION_VALIDATION_DISABLED_ERROR,
  AZURE_CONNECTION_VALIDATION_FALLBACK_ERROR,
} from "@/lib/azure-cloud-connection-copy";
import { isApiRequestError } from "@/lib/api-request-error";
import { resolveApiErrorMessage } from "@/lib/resolve-api-error-message";

export type HostedAzureValidationErrorReason =
  | "permission"
  | "federation"
  | "not-configured"
  | "disabled"
  | "unknown";

export type SanitizedHostedAzureValidationError = {
  readonly message: string;
  readonly technicalDetail?: string;
  readonly reason: HostedAzureValidationErrorReason;
};

/**
 * Maps hosted Azure validation API failures to operator-facing guidance.
 * An app registration alone is not enough; federation + Reader + host enablement are required.
 */
export function sanitizeHostedAzureValidationError(error: unknown): SanitizedHostedAzureValidationError {
  const raw = resolveApiErrorMessage(error, AZURE_CONNECTION_VALIDATION_FALLBACK_ERROR);
  const httpStatus = isApiRequestError(error) ? error.httpStatus : null;
  const haystack = `${httpStatus ?? ""} ${raw}`;

  if (/stack|trace|exception|System\./i.test(raw)) {
    return { message: AZURE_CONNECTION_VALIDATION_FALLBACK_ERROR, reason: "unknown" };
  }

  if (httpStatus === 503 || /503|disabled|Hosted Azure extractor is disabled/i.test(haystack)) {
    return {
      message: AZURE_CONNECTION_VALIDATION_DISABLED_ERROR,
      technicalDetail: raw.length < 200 ? raw : undefined,
      reason: "disabled",
    };
  }

  if (httpStatus === 404 || /404|not found|not configured|No hosted Azure extractor configuration/i.test(haystack)) {
    return {
      message:
        "No saved Azure connection was found for this subscription. Save the connection with the correct tenant ID, client ID, and subscription ID, then run validation again.",
      technicalDetail: raw.length < 200 ? raw : undefined,
      reason: "not-configured",
    };
  }

  if (httpStatus === 403 || /403|forbidden|unauthorized|401/i.test(haystack)) {
    return {
      message:
        "ArchLucid could not read the subscription. Confirm Reader is assigned to the service principal at subscription scope, and that the federated credential trusts ArchLucid's managed identity (an app registration alone is not enough).",
      technicalDetail: raw.length < 200 ? raw : undefined,
      reason: "permission",
    };
  }

  if (
    raw !== AZURE_CONNECTION_VALIDATION_FALLBACK_ERROR
    && /AADSTS|federat|client assertion|managed identity|AuthenticationFailed|credential/i.test(raw)
  ) {
    return {
      message:
        "Federated sign-in to your app registration failed. Confirm the federated credential issuer and subject match the ArchLucid tenant and managed-identity object IDs from onboarding — creating the app registration alone is not enough.",
      technicalDetail: raw.length < 200 && !/stack|trace|exception/i.test(raw) ? raw : undefined,
      reason: "federation",
    };
  }

  if (raw.length > 240) {
    return { message: AZURE_CONNECTION_VALIDATION_FALLBACK_ERROR, reason: "unknown" };
  }

  return { message: raw, reason: "unknown" };
}
