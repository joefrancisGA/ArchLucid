import { isApiRequestError } from "@/lib/api-request-error";
import { resolveApiErrorMessage } from "@/lib/resolve-api-error-message";

export type SanitizedHostedAzureValidationError = {
  readonly message: string;
  readonly technicalDetail?: string;
};

const FALLBACK =
  "Validation could not be completed. Confirm federated credentials, Reader on the subscription, and that hosted Azure collection is enabled — then try again.";

/**
 * Maps hosted Azure validation API failures to operator-facing guidance.
 * An app registration alone is not enough; federation + Reader + host enablement are required.
 */
export function sanitizeHostedAzureValidationError(error: unknown): SanitizedHostedAzureValidationError {
  const raw = resolveApiErrorMessage(error, FALLBACK);
  const httpStatus = isApiRequestError(error) ? error.httpStatus : null;
  const haystack = `${httpStatus ?? ""} ${raw}`;

  if (/stack|trace|exception|System\./i.test(raw)) {
    return { message: FALLBACK };
  }

  if (httpStatus === 503 || /503|disabled|Hosted Azure extractor is disabled/i.test(haystack)) {
    return {
      message:
        "Hosted Azure collection is not enabled in this ArchLucid environment. Contact your ArchLucid administrator — an app registration in Azure cannot complete validation until the host enables it.",
      technicalDetail: raw.length < 200 ? raw : undefined,
    };
  }

  if (httpStatus === 404 || /404|not found|not configured|No hosted Azure extractor configuration/i.test(haystack)) {
    return {
      message:
        "No saved Azure connection was found for this subscription. Save the connection with the correct tenant ID, client ID, and subscription ID, then run validation again.",
      technicalDetail: raw.length < 200 ? raw : undefined,
    };
  }

  if (httpStatus === 403 || /403|forbidden|unauthorized|401/i.test(haystack)) {
    return {
      message:
        "ArchLucid could not read the subscription. Confirm Reader is assigned to the service principal at subscription scope, and that the federated credential trusts ArchLucid's managed identity (an app registration alone is not enough).",
      technicalDetail: raw.length < 200 ? raw : undefined,
    };
  }

  if (
    /AADSTS|federat|client assertion|managed identity|AuthenticationFailed|credential/i.test(raw)
    || httpStatus === 500
  ) {
    return {
      message:
        "Federated sign-in to your app registration failed. Confirm the federated credential issuer and subject match the ArchLucid tenant and managed-identity object IDs from onboarding — creating the app registration alone is not enough.",
      technicalDetail: raw.length < 200 && !/stack|trace|exception/i.test(raw) ? raw : undefined,
    };
  }

  if (raw.length > 240) {
    return { message: FALLBACK };
  }

  return { message: raw };
}
