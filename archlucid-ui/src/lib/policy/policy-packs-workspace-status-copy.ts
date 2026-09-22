/** When assignment API returns no rows but registered inventory exists. */
export const POLICY_PACKS_WORKSPACE_ASSIGNMENTS_EMPTY_WITH_INVENTORY_LINE =
  "No workspace pack assignments returned for this scope. Registered packs and the merged effective policy below reflect catalog inventory — not assignment toggles from this list." as const;

/** When assignment API returns no rows and inventory is also empty. */
export const POLICY_PACKS_WORKSPACE_ASSIGNMENTS_EMPTY_LINE =
  "No policy packs are available for this workspace." as const;

export function resolvePolicyPacksWorkspaceAssignmentsEmptyLine(registeredPackCount: number): string {
  if (registeredPackCount > 0) {
    return POLICY_PACKS_WORKSPACE_ASSIGNMENTS_EMPTY_WITH_INVENTORY_LINE;
  }

  return POLICY_PACKS_WORKSPACE_ASSIGNMENTS_EMPTY_LINE;
}

export function resolvePolicyPacksEffectiveLayersHelper(input: {
  readonly effectiveLayerCount: number;
  readonly registeredPackCount: number;
  readonly workspaceAssignmentCount: number;
}): string {
  if (input.workspaceAssignmentCount > 0) {
    return "Resolved for current scope";
  }

  if (input.registeredPackCount > 0 && input.effectiveLayerCount > 0) {
    return "Merged effective policy for this scope (assignment list empty)";
  }

  if (input.registeredPackCount === 0) {
    return "No packs registered for this workspace";
  }

  return "Resolved for current scope";
}
