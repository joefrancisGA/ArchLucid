/** Reconcile run completed with zero rows — mismatch work may remain. */
export const DIAGRAM_RECONCILE_ZERO_CHANGES_NOT_CLEAN_LINE =
  "A reconcile run that stored zero change rows does not mean the diagram matches inventory — review scope, diagram source, and snapshot alignment." as const;

export function shouldShowDiagramReconcileZeroChangesHonesty(storedRowCount: number): boolean {
  return storedRowCount === 0;
}