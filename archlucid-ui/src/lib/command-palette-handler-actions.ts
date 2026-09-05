import {
  isCommandPaletteFinalizeReviewAvailable,
  isCommandPaletteReviewSaveAvailable,
} from "@/lib/command-palette-work-action-dom";

export const COMMAND_PALETTE_SAVE_DRAFT_EVENT = "archlucid-command-palette-save-draft";
export const COMMAND_PALETTE_UNDO_MUTATION_EVENT = "archlucid-command-palette-undo-mutation";
export const COMMAND_PALETTE_FINDING_NEXT_EVENT = "archlucid-command-palette-finding-next";
export const COMMAND_PALETTE_FINDING_PREV_EVENT = "archlucid-command-palette-finding-prev";
/** Alias for WD-05 listeners that used the longer event name. */
export const COMMAND_PALETTE_FINDING_PREVIOUS_EVENT = COMMAND_PALETTE_FINDING_PREV_EVENT;
export const COMMAND_PALETTE_FINDING_ACCEPT_EVENT = "archlucid-command-palette-finding-accept";
export const COMMAND_PALETTE_FINDING_REMEDIATE_EVENT = "archlucid-command-palette-finding-remediate";
export const COMMAND_PALETTE_FINDING_REJECT_EVENT = "archlucid-command-palette-finding-reject";
export const COMMAND_PALETTE_FINDING_CHECKLIST_BAND_EVENT = "archlucid-command-palette-finding-checklist-band";
export const COMMAND_PALETTE_ALERT_NEXT_EVENT = "archlucid-command-palette-alert-next";
export const COMMAND_PALETTE_ALERT_PREV_EVENT = "archlucid-command-palette-alert-prev";
export const COMMAND_PALETTE_ALERT_ACKNOWLEDGE_EVENT = "archlucid-command-palette-alert-acknowledge";
export const COMMAND_PALETTE_ALERT_RESOLVE_EVENT = "archlucid-command-palette-alert-resolve";
export const COMMAND_PALETTE_ALERT_SUPPRESS_EVENT = "archlucid-command-palette-alert-suppress";
export const COMMAND_PALETTE_FINALIZE_REVIEW_EVENT = "archlucid-command-palette-finalize-review";

export type CommandPaletteHandlerActionId =
  | "action-save-draft"
  | "action-finalize-review"
  | "action-undo-mutation"
  | "action-finding-next"
  | "action-finding-prev"
  | "action-finding-accept"
  | "action-finding-remediate"
  | "action-finding-reject"
  | "action-finding-checklist-band"
  | "action-alert-next"
  | "action-alert-prev"
  | "action-alert-acknowledge"
  | "action-alert-resolve"
  | "action-alert-suppress";

export type CommandPaletteHandlerAvailabilityContext = {
  readonly reversibleUndoAvailable?: boolean;
};

export type CommandPaletteHandlerAction = {
  readonly id: CommandPaletteHandlerActionId;
  readonly label: string;
  readonly searchValue: string;
  readonly isAvailable: (pathname: string, context?: CommandPaletteHandlerAvailabilityContext) => boolean;
};

const architectureDraftPathPattern = /^\/architecture\/architectures(\/|$)/;
const reviewDetailPathPattern = /^\/architecture\/reviews\/[^/]+/;
const findingsQueuePathPattern = /^\/governance\/findings(\/|$)/;
const alertsPathPattern = /^\/governance\/alerts(\/|$)/;

export function isArchitectureDraftWorkPath(pathname: string): boolean {
  return architectureDraftPathPattern.test(pathname);
}

export function isFindingsWorkPath(pathname: string): boolean {
  return findingsQueuePathPattern.test(pathname) || reviewDetailPathPattern.test(pathname);
}

export function isReviewDetailWorkPath(pathname: string): boolean {
  return reviewDetailPathPattern.test(pathname);
}

export function isAlertsWorkPath(pathname: string): boolean {
  return alertsPathPattern.test(pathname);
}

/** True when a reversible-mutation Undo control is on the page (LI-07 / WD-05). */
export function isCommandPaletteReversibleUndoAvailable(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.querySelector('[data-testid$="-undo"]:not([disabled])') !== null;
}

export const COMMAND_PALETTE_HANDLER_ACTIONS: readonly CommandPaletteHandlerAction[] = [
  {
    id: "action-save-draft",
    label: "Save changes",
    searchValue: "action save draft architecture workspace review disposition remediation",
    isAvailable: (pathname) =>
      isArchitectureDraftWorkPath(pathname)
      || (isReviewDetailWorkPath(pathname) && isCommandPaletteReviewSaveAvailable()),
  },
  {
    id: "action-finalize-review",
    label: "Finalize review",
    searchValue: "action finalize review commit seal scorecard ready",
    isAvailable: (pathname) =>
      isReviewDetailWorkPath(pathname) && isCommandPaletteFinalizeReviewAvailable(),
  },
  {
    id: "action-undo-mutation",
    label: "Undo last reversible change",
    searchValue: "action undo disposition mutation reversible",
    isAvailable: (_pathname, context) =>
      context?.reversibleUndoAvailable === true || isCommandPaletteReversibleUndoAvailable(),
  },
  {
    id: "action-finding-next",
    label: "Focus next finding",
    searchValue: "action finding next alt+j triage card",
    isAvailable: (pathname) => isFindingsWorkPath(pathname),
  },
  {
    id: "action-finding-prev",
    label: "Focus previous finding",
    searchValue: "action finding previous alt+k triage card",
    isAvailable: (pathname) => isFindingsWorkPath(pathname),
  },
  {
    id: "action-finding-accept",
    label: "Accept focused finding",
    searchValue: "action finding accept alt+1 disposition",
    isAvailable: (pathname) => isFindingsWorkPath(pathname),
  },
  {
    id: "action-finding-remediate",
    label: "Mark focused finding remediated",
    searchValue: "action finding remediate alt+2 disposition",
    isAvailable: (pathname) => isFindingsWorkPath(pathname),
  },
  {
    id: "action-finding-reject",
    label: "Reject focused finding as not applicable",
    searchValue: "action finding reject alt+3 disposition",
    isAvailable: (pathname) => isFindingsWorkPath(pathname),
  },
  {
    id: "action-finding-checklist-band",
    label: "Open checklist band",
    searchValue: "action finding checklist band classification coverage",
    isAvailable: (pathname) => isReviewDetailWorkPath(pathname),
  },
  {
    id: "action-alert-next",
    label: "Focus next alert",
    searchValue: "action alert next alt+j triage",
    isAvailable: (pathname) => isAlertsWorkPath(pathname),
  },
  {
    id: "action-alert-prev",
    label: "Focus previous alert",
    searchValue: "action alert previous alt+k triage",
    isAvailable: (pathname) => isAlertsWorkPath(pathname),
  },
  {
    id: "action-alert-acknowledge",
    label: "Acknowledge focused alert",
    searchValue: "action alert acknowledge alt+1 triage",
    isAvailable: (pathname) => isAlertsWorkPath(pathname),
  },
  {
    id: "action-alert-resolve",
    label: "Resolve focused alert",
    searchValue: "action alert resolve alt+2 triage",
    isAvailable: (pathname) => isAlertsWorkPath(pathname),
  },
  {
    id: "action-alert-suppress",
    label: "Suppress focused alert",
    searchValue: "action alert suppress alt+3 triage",
    isAvailable: (pathname) => isAlertsWorkPath(pathname),
  },
];

const HANDLER_ACTION_EVENTS: Record<CommandPaletteHandlerActionId, string> = {
  "action-save-draft": COMMAND_PALETTE_SAVE_DRAFT_EVENT,
  "action-finalize-review": COMMAND_PALETTE_FINALIZE_REVIEW_EVENT,
  "action-undo-mutation": COMMAND_PALETTE_UNDO_MUTATION_EVENT,
  "action-finding-next": COMMAND_PALETTE_FINDING_NEXT_EVENT,
  "action-finding-prev": COMMAND_PALETTE_FINDING_PREV_EVENT,
  "action-finding-accept": COMMAND_PALETTE_FINDING_ACCEPT_EVENT,
  "action-finding-remediate": COMMAND_PALETTE_FINDING_REMEDIATE_EVENT,
  "action-finding-reject": COMMAND_PALETTE_FINDING_REJECT_EVENT,
  "action-finding-checklist-band": COMMAND_PALETTE_FINDING_CHECKLIST_BAND_EVENT,
  "action-alert-next": COMMAND_PALETTE_ALERT_NEXT_EVENT,
  "action-alert-prev": COMMAND_PALETTE_ALERT_PREV_EVENT,
  "action-alert-acknowledge": COMMAND_PALETTE_ALERT_ACKNOWLEDGE_EVENT,
  "action-alert-resolve": COMMAND_PALETTE_ALERT_RESOLVE_EVENT,
  "action-alert-suppress": COMMAND_PALETTE_ALERT_SUPPRESS_EVENT,
};

export function dispatchCommandPaletteHandlerAction(actionId: CommandPaletteHandlerActionId): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(HANDLER_ACTION_EVENTS[actionId]));
}
