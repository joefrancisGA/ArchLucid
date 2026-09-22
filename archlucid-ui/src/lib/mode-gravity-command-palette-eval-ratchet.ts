/** MG-015 — Working palette must not advertise eval-only destinations as desk verbs. */
export const MODE_GRAVITY_COMMAND_PALETTE_EVAL_RATchet_OWNER = "MG-015" as const;

export const MODE_GRAVITY_COMMAND_PALETTE_FILTER_MODULE =
  "filter-working-palette-nav-hrefs" as const;

export const MODE_GRAVITY_COMMAND_PALETTE_WIRED_HELPERS = [
  "visibleOperatorShellHrefSetFromNavRows",
  "filterWorkingPaletteNavHrefs",
  "filterNavGroupsForWorkingProfessionalMode",
] as const;
