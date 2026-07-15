import {
  SSO_WIZARD_ACTIVATE_ERROR,
  SSO_WIZARD_BANNED_UI_PATTERNS,
  SSO_WIZARD_DISCOVERY_ERROR,
  SSO_WIZARD_GENERIC_ERROR,
  SSO_WIZARD_TEST_LOGIN_ERROR,
} from "@/lib/sso-wizard-copy";

const HTTP_STATUS_PATTERN = /\(HTTP\s+\d{3}\)/i;

function containsBannedCustomerCopy(text: string): boolean {
  return SSO_WIZARD_BANNED_UI_PATTERNS.some((pattern) => pattern.test(text));
}

/** Maps API or exception text to administrator-safe wizard errors. */
export function formatSsoWizardCustomerError(
  fallback: string,
  raw: string | null | undefined,
): string {
  const text = (raw ?? "").trim();

  if (text.length === 0) {
    return fallback;
  }

  if (containsBannedCustomerCopy(text) || HTTP_STATUS_PATTERN.test(text)) {
    return fallback;
  }

  return text;
}

export function formatSsoWizardDiscoveryError(raw: string | null | undefined): string {
  return formatSsoWizardCustomerError(SSO_WIZARD_DISCOVERY_ERROR, raw);
}

export function formatSsoWizardTestLoginError(raw: string | null | undefined): string {
  return formatSsoWizardCustomerError(SSO_WIZARD_TEST_LOGIN_ERROR, raw);
}

export function formatSsoWizardActivateError(raw: string | null | undefined): string {
  return formatSsoWizardCustomerError(SSO_WIZARD_ACTIVATE_ERROR, raw);
}

export function formatSsoWizardUnexpectedError(error: unknown): string {
  if (error instanceof Error) {
    return formatSsoWizardCustomerError(SSO_WIZARD_GENERIC_ERROR, error.message);
  }

  return SSO_WIZARD_GENERIC_ERROR;
}

export function sanitizeSsoWizardDiagnosticSummary(summary: string | null | undefined): string {
  return formatSsoWizardCustomerError("Connection test completed successfully.", summary);
}
