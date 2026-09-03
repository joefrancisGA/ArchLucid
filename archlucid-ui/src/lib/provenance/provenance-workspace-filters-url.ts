import type { ProvenanceViewMode } from "@/components/provenance/ProvenanceViewModeSwitcher";
import type { ProvenanceNodeFilterCategory } from "@/lib/provenance-node-presentation";

export const PROVENANCE_VIEW_PARAM = "view";
export const PROVENANCE_CATEGORY_PARAM = "category";

const PROVENANCE_VIEW_IDS = new Set<string>(["graph", "timeline", "table"]);

const PROVENANCE_CATEGORY_IDS = new Set<string>([
  "evidence",
  "findings",
  "controls",
  "decisions",
  "governance",
  "artifacts",
]);

export const DEFAULT_PROVENANCE_VIEW_MODE: ProvenanceViewMode = "graph";

export function parseProvenanceViewModeFromSearch(raw: string | null | undefined): ProvenanceViewMode {
  if (raw === null || raw === undefined) {
    return DEFAULT_PROVENANCE_VIEW_MODE;
  }

  const trimmed = raw.trim();

  if (!PROVENANCE_VIEW_IDS.has(trimmed)) {
    return DEFAULT_PROVENANCE_VIEW_MODE;
  }

  return trimmed as ProvenanceViewMode;
}

export function parseProvenanceCategoryFromSearch(
  raw: string | null | undefined,
): ProvenanceNodeFilterCategory | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!PROVENANCE_CATEGORY_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as ProvenanceNodeFilterCategory;
}

export function provenanceViewModeHrefFromSearch(
  currentSearch: string,
  viewMode: ProvenanceViewMode,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (viewMode === DEFAULT_PROVENANCE_VIEW_MODE) {
    params.delete(PROVENANCE_VIEW_PARAM);
  } else {
    params.set(PROVENANCE_VIEW_PARAM, viewMode);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function provenanceCategoryHrefFromSearch(
  currentSearch: string,
  category: ProvenanceNodeFilterCategory | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (category === null) {
    params.delete(PROVENANCE_CATEGORY_PARAM);
  } else {
    params.set(PROVENANCE_CATEGORY_PARAM, category);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
