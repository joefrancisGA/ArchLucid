import {
  COMMAND_PALETTE_ACTIONS,
  type CommandPaletteHrefAction,
} from "@/lib/command-palette-actions";
import {
  COMMAND_PALETTE_HANDLER_ACTIONS,
  type CommandPaletteHandlerAction,
} from "@/lib/command-palette-handler-actions";

export type VisibleCommandPaletteAction = CommandPaletteHrefAction | CommandPaletteHandlerAction;

const WORKING_MODE_HIDDEN_ACTION_IDS = new Set(["action-finish-setup"]);

/** Working palette omits first-session setup rows; Guided/demo keep them (PT-06 / PT-10). */
export function resolveVisibleCommandPaletteHrefActions(
  workingMode: boolean,
): readonly CommandPaletteHrefAction[] {
  if (!workingMode) {
    return COMMAND_PALETTE_ACTIONS;
  }

  return COMMAND_PALETTE_ACTIONS.filter((action) => !WORKING_MODE_HIDDEN_ACTION_IDS.has(action.id));
}

export function resolveVisibleCommandPaletteHandlerActions(
  pathname: string,
): readonly CommandPaletteHandlerAction[] {
  return COMMAND_PALETTE_HANDLER_ACTIONS.filter((action) => action.isAvailable(pathname));
}
