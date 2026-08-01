export const MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY =
  "Sign in with a workspace administrator account to manage AI and model governance.";

export const MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY =
  "Model governance settings are temporarily unavailable. Try again in a few minutes or contact support if this continues.";

export const MODEL_GOVERNANCE_UPDATE_FAILED_COPY =
  "Could not update the workspace profile. Try again in a few minutes.";

export const MODEL_GOVERNANCE_CLEAR_OVERRIDE_FAILED_COPY =
  "Could not clear the workspace profile override. Try again in a few minutes.";

export const MODEL_GOVERNANCE_UNEXPECTED_RESPONSE_COPY =
  "Unexpected model governance response from the API.";

export const MODEL_GOVERNANCE_UNEXPECTED_ERROR_COPY =
  "Could not load model governance settings. Try again in a few minutes.";

export const MODEL_GOVERNANCE_CATALOG_UNAVAILABLE_COPY =
  "Governed alias catalog is temporarily unavailable. You can still change the workspace execution profile below.";

export const MODEL_GOVERNANCE_REGISTRY_EMPTY_COPY =
  "No governed model aliases are registered for this workspace yet. Alias entries appear here after platform configuration.";

export const MODEL_GOVERNANCE_PROFILE_MAPPINGS_EMPTY_COPY =
  "No profile-to-alias mappings are available yet. Mappings appear here when the governed alias catalog is configured.";

export function modelGovernanceLoadBlockedMessage(status: number): string {
  if (status === 401 || status === 403) {
    return MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY;
  }

  return MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY;
}
