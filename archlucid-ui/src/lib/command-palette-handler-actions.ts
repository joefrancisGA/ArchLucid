export const COMMAND_PALETTE_SAVE_DRAFT_EVENT = "archlucid-command-palette-save-draft";
export const COMMAND_PALETTE_UNDO_MUTATION_EVENT = "archlucid-command-palette-undo-mutation";
export const COMMAND_PALETTE_FINDING_NEXT_EVENT = "archlucid-command-palette-finding-next";
export const COMMAND_PALETTE_FINDING_PREVIOUS_EVENT = "archlucid-command-palette-finding-previous";
export const COMMAND_PALETTE_FINDING_ACCEPT_EVENT = "archlucid-command-palette-finding-accept";
export const COMMAND_PALETTE_FINDING_REMEDIATE_EVENT = "archlucid-command-palette-finding-remediate";
export const COMMAND_PALETTE_FINDING_REJECT_EVENT = "archlucid-command-palette-finding-reject";

export type CommandPaletteHandlerActionId =
  | "action-save-draft"
  | "action-undo-mutation"
  | "action-finding-next"
  | "action-finding-previous"
  | "action-finding-accept"
  | "action-finding-remediate"
  | "action-finding-reject";

export type CommandPaletteHandlerAction = {
  readonly id: CommandPaletteHandlerActionId;
  readonly label: string;
  readonly searchValue: string;
  readonly isAvailable: (pathname: string) => boolean;
};

const architectureDraftPathPattern = /^\/architecture\/architectures(\/|$)/;
const findingsDeskPathPattern =
  /^\/(architecture\/reviews\/[^/]+\/findings|governance\/findings)(\/|$)/;

function hasVisibleUndoControl(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.querySelector('[data-testid$="-undo"]:not([disabled])') !== null;
}

export const COMMAND_PALETTE_HANDLER_ACTIONS: readonly CommandPaletteHandlerAction[] = [
  {
    id: "action-save-draft",
    label: "Save architecture draft",
    searchValue: "action save draft architecture workspace",
    isAvailable: (pathname) => architectureDraftPathPattern.test(pathname),
  },
  {
    id: "action-undo-mutation",
    label: "Undo last reversible change",
    searchValue: "action undo disposition mutation reversible",
    isAvailable: () => hasVisibleUndoControl(),
  },
  {
    id: "action-finding-next",
    label: "Focus next finding",
    searchValue: "action finding next card triage alt j",
    isAvailable: (pathname) => findingsDeskPathPattern.test(pathname),
  },
  {
    id: "action-finding-previous",
    label: "Focus previous finding",
    searchValue: "action finding previous card triage alt k",
    isAvailable: (pathname) => findingsDeskPathPattern.test(pathname),
  },
  {
    id: "action-finding-accept",
    label: "Accept focused finding",
    searchValue: "action finding accept disposition alt 1",
    isAvailable: (pathname) => findingsDeskPathPattern.test(pathname),
  },
  {
    id: "action-finding-remediate",
    label: "Mark focused finding remediated",
    searchValue: "action finding remediate disposition alt 2",
    isAvailable: (pathname) => findingsDeskPathPattern.test(pathname),
  },
  {
    id: "action-finding-reject",
    label: "Reject focused finding as not applicable",
    searchValue: "action finding reject disposition alt 3",
    isAvailable: (pathname) => findingsDeskPathPattern.test(pathname),
  },
];

export function dispatchCommandPaletteHandlerAction(actionId: CommandPaletteHandlerActionId): void {
  if (typeof window === "undefined") {
    return;
  }

  if (actionId === "action-save-draft") {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_SAVE_DRAFT_EVENT));
    return;
  }

  if (actionId === "action-undo-mutation") {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_UNDO_MUTATION_EVENT));
    return;
  }

  if (actionId === "action-finding-next") {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_FINDING_NEXT_EVENT));
    return;
  }

  if (actionId === "action-finding-previous") {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_FINDING_PREVIOUS_EVENT));
    return;
  }

  if (actionId === "action-finding-accept") {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_FINDING_ACCEPT_EVENT));
    return;
  }

  if (actionId === "action-finding-remediate") {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_FINDING_REMEDIATE_EVENT));
    return;
  }

  if (actionId === "action-finding-reject") {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_FINDING_REJECT_EVENT));
  }
}
