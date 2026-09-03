export const COMMAND_PALETTE_SAVE_DRAFT_EVENT = "archlucid-command-palette-save-draft";
export const COMMAND_PALETTE_UNDO_MUTATION_EVENT = "archlucid-command-palette-undo-mutation";

export type CommandPaletteHandlerActionId = "action-save-draft" | "action-undo-mutation";

export type CommandPaletteHandlerAction = {
  readonly id: CommandPaletteHandlerActionId;
  readonly label: string;
  readonly searchValue: string;
  readonly isAvailable: (pathname: string) => boolean;
};

const architectureDraftPathPattern = /^\/architecture\/architectures(\/|$)/;

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
    isAvailable: () => true,
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
  }
}
