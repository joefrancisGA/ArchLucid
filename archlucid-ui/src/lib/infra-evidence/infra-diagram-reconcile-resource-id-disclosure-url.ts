export const INFRA_DIAGRAM_RECONCILE_RESOURCE_ID_DISCLOSURE_OPEN_PARAM =
  "infraDiagramReconcileResourceIdDisclosureOpen";

export function parseInfraDiagramReconcileResourceIdDisclosureOpenFromSearch(
  raw: string | null | undefined,
): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function infraDiagramReconcileResourceIdDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(INFRA_DIAGRAM_RECONCILE_RESOURCE_ID_DISCLOSURE_OPEN_PARAM);
  } else {
    params.set(INFRA_DIAGRAM_RECONCILE_RESOURCE_ID_DISCLOSURE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
