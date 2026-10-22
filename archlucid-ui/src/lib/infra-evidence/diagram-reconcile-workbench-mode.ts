export type DiagramReconcileWorkbenchMode = "advisory" | "sealed";

export const DIAGRAM_RECONCILE_COMPARE_MODE_PARAM = "compareMode";

export function parseDiagramReconcileWorkbenchModeFromSearch(
  raw: string | null | undefined,
  runIdFromUrl: string,
): DiagramReconcileWorkbenchMode {
  const trimmed = (raw ?? "").trim().toLowerCase();

  if (trimmed === "advisory" || trimmed === "sealed") {
    return trimmed;
  }

  return runIdFromUrl.trim().length > 0 ? "sealed" : "advisory";
}

export function isDiagramReconcileAdvisoryWorkbenchMode(mode: DiagramReconcileWorkbenchMode): boolean {
  return mode === "advisory";
}
