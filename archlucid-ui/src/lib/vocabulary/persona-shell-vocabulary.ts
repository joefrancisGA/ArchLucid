/**
 * Customer-facing persona shell labels.
 * Internal routes, API values, and persisted `operator` mode stay unchanged — translate here for UI only.
 */
export const PERSONA_SHELL_LABELS = {
  architect: "Architect",
  executive: "Executive",
  switchGroupAriaLabel: "Switch shell view",
} as const;

/** Cross-shell handoff link copy (executive → architect workspace). */
export const PERSONA_SHELL_HANDOFF_LINK = "Open in Architect →";

/** Lowercase phrase for inline “open the other shell” links. */
export const PERSONA_SHELL_OPEN_IN_ARCHITECT_VIEW = "Open in architect view";

/** Workspace / shell naming in help and documentation surfaces. */
export const PERSONA_SHELL_WORKSPACE_LABEL = "Architect workspace";

export const PERSONA_SHELL_WORKSPACE_MAP_LABEL = "Architect workspace map";

export const PERSONA_SHELL_WORKSPACE_UI_MAP_LABEL = "Architect workspace (UI map)";

/** Top-bar wordmark accessible name in the architect workspace shell. */
export const PERSONA_SHELL_WORDMARK_ARIA_LABEL = "ArchLucid — go to Overview";

/** Sign-out control when JWT session ends and the browser returns to `/`. */
export const PERSONA_SHELL_SIGN_OUT_HOME_ARIA_LABEL = "Sign out and return to Overview";

/** Default document title for signed-in workspace routes (browser tab). */
export const PERSONA_SHELL_DEFAULT_DOCUMENT_TITLE = "ArchLucid workspace";
