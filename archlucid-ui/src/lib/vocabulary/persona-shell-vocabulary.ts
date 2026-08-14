/**
 * Customer-facing persona shell labels.
 * Internal routes, API values, and persisted `operator` mode stay unchanged — translate here for UI only.
 */
import { PRIMARY_ARCHITECT_PERSONA, PRIMARY_SPONSOR_PERSONA } from "@/lib/vocabulary/primary-persona-vocabulary";

export const PERSONA_SHELL_LABELS = {
  architect: PRIMARY_ARCHITECT_PERSONA.label,
  sponsor: PRIMARY_SPONSOR_PERSONA.label,
  switchGroupAriaLabel: PRIMARY_ARCHITECT_PERSONA.shellSwitchAriaLabel,
} as const;

/** Cross-shell handoff link copy (sponsor → architect workspace). */
export const PERSONA_SHELL_HANDOFF_LINK = PRIMARY_ARCHITECT_PERSONA.handoffLinkLabel;

/** Lowercase phrase for inline “open the other shell” links. */
export const PERSONA_SHELL_OPEN_IN_ARCHITECT_VIEW = PRIMARY_ARCHITECT_PERSONA.openInViewLabel;

/** Workspace / shell naming in help and documentation surfaces. */
export const PERSONA_SHELL_WORKSPACE_LABEL = PRIMARY_ARCHITECT_PERSONA.workspaceLabel;

export const PERSONA_SHELL_WORKSPACE_MAP_LABEL = PRIMARY_ARCHITECT_PERSONA.workspaceMapLabel;

export const PERSONA_SHELL_WORKSPACE_UI_MAP_LABEL = PRIMARY_ARCHITECT_PERSONA.workspaceUiMapLabel;

/** Top-bar wordmark accessible name in the architect workspace shell. */
export const PERSONA_SHELL_WORDMARK_ARIA_LABEL = PRIMARY_ARCHITECT_PERSONA.wordmarkAriaLabel;

/** Sign-out control when JWT session ends and the browser returns to `/`. */
export const PERSONA_SHELL_SIGN_OUT_HOME_ARIA_LABEL = PRIMARY_ARCHITECT_PERSONA.signOutHomeAriaLabel;

/** Default document title for signed-in workspace routes (browser tab). */
export const PERSONA_SHELL_DEFAULT_DOCUMENT_TITLE = PRIMARY_ARCHITECT_PERSONA.defaultDocumentTitle;
