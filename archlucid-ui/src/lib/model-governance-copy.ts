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
  "No approved model aliases are registered for this workspace yet. Alias entries appear here after platform configuration.";

export const MODEL_GOVERNANCE_PROFILE_MAPPINGS_EMPTY_COPY =
  "No profile-to-alias mappings are available yet. Mappings appear here when the governed alias catalog is configured.";

export const MODEL_GOVERNANCE_PROFILE_CONFIRM_TITLE_COPY = "Change workspace execution profile?";

export const MODEL_GOVERNANCE_PROFILE_CONFIRM_DESCRIPTION_COPY =
  "This applies a workspace-wide model execution profile for all future architecture reviews.";

export const MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_TITLE_COPY = "Use workspace default profile?";

export const MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_DESCRIPTION_COPY =
  "This removes the tenant override and restores the workspace default execution profile.";

export const MODEL_GOVERNANCE_PROFILE_CONFIRM_LABEL_COPY = "Apply profile";

export const MODEL_GOVERNANCE_PROFILE_CONFIRM_CLEAR_LABEL_COPY = "Use workspace default";

export const MODEL_GOVERNANCE_PROFILE_SUCCESS_COPY = "Workspace execution profile updated.";

export const MODEL_GOVERNANCE_PROFILE_CLEAR_SUCCESS_COPY = "Workspace execution profile override cleared.";

export const MODEL_GOVERNANCE_PROFILE_LAST_CHANGED_UNAVAILABLE_COPY =
  "Last profile change is not available yet.";

export const MODEL_GOVERNANCE_PROFILE_AUDIT_DEEP_LINK_EVENT_TYPE =
  "Workspace.ModelExecutionProfileUpdated" as const;

export const MODEL_GOVERNANCE_CONNECTION_STATEMENT_COPY =
  "Provider connections run through ArchLucid-managed trust boundaries. Engine choice applies to review completions only — embeddings and retrieval indexes remain ArchLucid-managed Azure OpenAI.";

export const MODEL_GOVERNANCE_EXTERNAL_SUBPROCESSOR_BOUNDARY_COPY =
  "Optional third-party completion engines are offered only after the subprocessors register and trust-center disclosure checklist is complete. Workspace administrators must acknowledge regulated-evidence routing before first use.";

export const MODEL_GOVERNANCE_CONNECTION_TRUST_CENTER_LABEL = "Security & Trust";

export const MODEL_GOVERNANCE_MUTATION_RETRY_LABEL = "Try again";

export const MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_TITLE_COPY = "Reset allowed engines to catalog default?";

export const MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_DESCRIPTION_COPY =
  "This deletes the workspace override for engine selection. Every future architecture review falls back to the catalog default set, and the engines you curated here are not restored automatically.";

export const MODEL_GOVERNANCE_ALLOWED_SET_RESET_CONFIRM_LABEL_COPY = "Reset to catalog default";

export function modelGovernanceProfileSuccessMessage(profileLabel: string): string {
  return `Workspace execution profile updated to ${profileLabel}.`;
}

export function modelGovernanceProfileLastChangedCopy(actor: string, changedAtLabel: string): string {
  return `Last changed by ${actor} · ${changedAtLabel}`;
}

export function modelGovernanceProfileSourceLabel(source: string): string {
  switch (source) {
    case "TenantOverride":
      return "Tenant override";
    case "WorkspaceDefault":
      return "Workspace default";
    default:
      return source;
  }
}

export function modelGovernanceLoadBlockedMessage(status: number): string {
  if (status === 401 || status === 403) {
    return MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY;
  }

  return MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY;
}
