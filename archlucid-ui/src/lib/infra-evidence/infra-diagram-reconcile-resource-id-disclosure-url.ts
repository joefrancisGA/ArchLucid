import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, INFRA_DIAGRAM_RECONCILE_RESOURCE_ID_DISCLOSURE_OPEN_PARAM);
}
