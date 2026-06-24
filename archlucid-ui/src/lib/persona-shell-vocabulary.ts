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
