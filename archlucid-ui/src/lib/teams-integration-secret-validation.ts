import { isTeamsWebhookHostname } from "@/lib/integration-webhook-hostname";
import {
  TEAMS_INTEGRATION_SECRET_ACCESS_FAILURE_MESSAGE,
  TEAMS_INTEGRATION_SECRET_NAME_NOT_URL_MESSAGE,
  TEAMS_INTEGRATION_SECRET_NAME_REQUIRED_MESSAGE,
} from "@/lib/teams-integration-page-copy";

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

/** Mirrors server-side name validation before a secret-store probe is attempted. */
export function validateTeamsKeyVaultSecretNameClient(secretName: string): TeamsSecretValidationResult {
  const trimmed = secretName.trim();

  if (trimmed.length === 0) {
    return { outcome: "invalid-name", message: TEAMS_INTEGRATION_SECRET_NAME_REQUIRED_MESSAGE };
  }

  if (trimmed.includes("://")) {
    return { outcome: "invalid-name", message: TEAMS_INTEGRATION_SECRET_NAME_NOT_URL_MESSAGE };
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
        message: TEAMS_INTEGRATION_SECRET_ACCESS_FAILURE_MESSAGE,
      };

    case "InvalidValue":
      return {
        outcome: "invalid-value",
        message: "The secret was found, but it does not contain a valid Teams webhook URL.",
      };

    case "InvalidName":
      return { outcome: "invalid-name", message: TEAMS_INTEGRATION_SECRET_NAME_NOT_URL_MESSAGE };

    default:
      return {
        outcome: "permission-denied",
        message: TEAMS_INTEGRATION_SECRET_ACCESS_FAILURE_MESSAGE,
      };
  }
}

function looksLikeTeamsWebhookUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());

    if (parsed.protocol !== "https:") {
      return false;
    }

    return isTeamsWebhookHostname(parsed.hostname);
  } catch {
    return false;
  }
}

/** Local fallback when the validate API is unavailable — checks name format only. */
export function validateTeamsKeyVaultSecretNameFallback(secretName: string): TeamsSecretValidationResult {
  return validateTeamsKeyVaultSecretNameClient(secretName);
}

export { looksLikeTeamsWebhookUrl };
