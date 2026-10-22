import { REVIEW_DETAIL_FINDING_PARAM } from "@/lib/review-detail-workspace-tabs";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

/** Legacy alias — hydrate once into `findingId`, then stop writing this param (LS-01). */
export const ARCHITECTURE_DIAGRAM_FINDING_PARAM = "diagramFindingId";

/** Reads canonical + legacy diagram finding params from the live address bar. */
export function readArchitectureDiagramFindingIdFromWindowLocation(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URL(window.location.href).searchParams;

  return parseArchitectureDiagramFindingIdFromSearch(
    params.get(REVIEW_DETAIL_FINDING_PARAM),
    params.get(ARCHITECTURE_DIAGRAM_FINDING_PARAM),
  );
}

export function parseArchitectureDiagramFindingIdFromSearch(
  findingIdRaw: string | null | undefined,
  diagramFindingIdRaw?: string | null | undefined,
): string {
  const findingId = (findingIdRaw ?? "").trim();

  if (findingId.length > 0) {
    return findingId;
  }

  return (diagramFindingIdRaw ?? "").trim();
}

export function architectureDiagramFindingHrefFromSearch(
  currentSearch: string,
  findingId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (findingId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(REVIEW_DETAIL_FINDING_PARAM);
      params.delete(ARCHITECTURE_DIAGRAM_FINDING_PARAM);
    } else {
      params.set(REVIEW_DETAIL_FINDING_PARAM, trimmed);
      params.delete(ARCHITECTURE_DIAGRAM_FINDING_PARAM);
    }
    },
  });
}
