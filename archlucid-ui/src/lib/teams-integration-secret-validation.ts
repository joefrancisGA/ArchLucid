export type TeamsSecretValidationOutcome =
  | "valid"
  | "invalid-name"
  | "not-found"
  | "permission-denied"
  | "invalid-value";

export type TeamsSecretValidationResult = {
  readonly outcome: TeamsSecretValidationOutcome;
  readonly message: string;
};

const URL_IN_NAME_MESSAGE = "Enter a Key Vault secret name, not a webhook URL.";

const REQUIRED_NAME_MESSAGE = "Enter a Key Vault secret name.";

/** Mirrors server-side name validation before a Key Vault probe is attempted. */
export function validateTeamsKeyVaultSecretNameClient(secretName: string): TeamsSecretValidationResult {
  const trimmed = secretName.trim();

  if (trimmed.length === 0) {
    return { outcome: "invalid-name", message: REQUIRED_NAME_MESSAGE };
  }

  if (trimmed.includes("://")) {
    return { outcome: "invalid-name", message: URL_IN_NAME_MESSAGE };
  }

  return { outcome: "valid", message: "Secret name format is valid." };
}

export function mapTeamsSecretValidationApiOutcome(outcome: string): TeamsSecretValidationResult {
  switch (outcome) {
    case "Found":
      return { outcome: "valid", message: "Secret found and accessible." };

    case "NotFound":
      return { outcome: "not-found", message: "We could not find a secret with that name." };

    case "PermissionDenied":
      return {
        outcome: "permission-denied",
        message: "ArchLucid cannot access this secret. Check the workspace’s Key Vault permissions.",
      };

    case "InvalidValue":
      return {
        outcome: "invalid-value",
        message: "The secret was found, but it does not contain a valid Teams webhook URL.",
      };

    case "InvalidName":
      return { outcome: "invalid-name", message: URL_IN_NAME_MESSAGE };

    default:
      return {
        outcome: "permission-denied",
        message: "ArchLucid cannot access this secret. Check the workspace’s Key Vault permissions.",
      };
  }
}

function looksLikeTeamsWebhookUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());

    if (parsed.protocol !== "https:") {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    return host.includes("webhook.office.com") || host.includes("office.com");
  } catch {
    return false;
  }
}

/** Local fallback when the validate API is unavailable — checks name format only. */
export function validateTeamsKeyVaultSecretNameFallback(secretName: string): TeamsSecretValidationResult {
  return validateTeamsKeyVaultSecretNameClient(secretName);
}

export { looksLikeTeamsWebhookUrl };
