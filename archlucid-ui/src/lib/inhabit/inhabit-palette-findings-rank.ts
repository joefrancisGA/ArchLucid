import type { CommandPaletteHandlerActionId } from "@/lib/command-palette-handler-actions";

const INHABIT_FINDINGS_PALETTE_HANDLER_PRIORITY: readonly CommandPaletteHandlerActionId[] = [
  "action-finding-accept",
  "action-finding-remediate",
  "action-finding-reject",
  "action-undo-mutation",
  "action-finalize-review",
  "action-clone-from-snapshot",
  "action-finding-next",
  "action-finding-prev",
  "action-save-draft",
  "action-room-elicitation",
];

function inhabitFindingsPalettePriority(actionId: CommandPaletteHandlerActionId): number {
  const index = INHABIT_FINDINGS_PALETTE_HANDLER_PRIORITY.indexOf(actionId);

  return index === -1 ? INHABIT_FINDINGS_PALETTE_HANDLER_PRIORITY.length + 1 : index;
}

/** IH-060 — work actions before nav on inhabited findings palette. */
export function sortInhabitFindingsPaletteHandlerActions<T extends { readonly id: CommandPaletteHandlerActionId }>(
  actions: readonly T[],
): readonly T[] {
  return [...actions].sort(
    (left, right) => inhabitFindingsPalettePriority(left.id) - inhabitFindingsPalettePriority(right.id),
  );
}
