import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { WORKING_NEW_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  COMMAND_PALETTE_ACTIONS,
  type CommandPaletteHrefAction,
} from "@/lib/command-palette-actions";
import {
  COMMAND_PALETTE_HANDLER_ACTIONS,
  type CommandPaletteHandlerAction,
  type CommandPaletteHandlerAvailabilityContext,
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

  return COMMAND_PALETTE_ACTIONS.filter((action) => !WORKING_MODE_HIDDEN_ACTION_IDS.has(action.id)).map((action) =>
    action.id === "action-create-review"
      ? {
          ...action,
          label: WORKING_NEW_REVIEW_LABEL,
          href: ARCHITECTURES_NEW_PATH,
          searchValue: "action create new review draft editor intake",
        }
      : action,
  );
}

export function resolveVisibleCommandPaletteHandlerActions(
  pathname: string,
  context?: CommandPaletteHandlerAvailabilityContext,
): readonly CommandPaletteHandlerAction[] {
  return COMMAND_PALETTE_HANDLER_ACTIONS.filter((action) => action.isAvailable(pathname, context));
}
