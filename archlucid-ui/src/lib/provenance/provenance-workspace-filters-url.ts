import type { ProvenanceViewMode } from "@/components/provenance/ProvenanceViewModeSwitcher";
import type { ProvenanceNodeFilterCategory } from "@/lib/provenance-node-presentation";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const PROVENANCE_VIEW_PARAM = "view";
export const PROVENANCE_CATEGORY_PARAM = "category";
export const PROVENANCE_TABLE_SEARCH_PARAM = "q";
export const PROVENANCE_TABLE_NODE_TYPE_PARAM = "nodeType";
export const PROVENANCE_TABLE_EDGE_SEARCH_PARAM = "edgeQ";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (viewMode === DEFAULT_PROVENANCE_VIEW_MODE) {
      params.delete(PROVENANCE_VIEW_PARAM);
    } else {
      params.set(PROVENANCE_VIEW_PARAM, viewMode);
    }
    },
  });
}

export function provenanceCategoryHrefFromSearch(
  currentSearch: string,
  category: ProvenanceNodeFilterCategory | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (category === null) {
      params.delete(PROVENANCE_CATEGORY_PARAM);
    } else {
      params.set(PROVENANCE_CATEGORY_PARAM, category);
    }
    },
  });
}

export function parseProvenanceTableSearchQueryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function parseProvenanceTableNodeTypeFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function provenanceTableSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      params.delete(PROVENANCE_TABLE_SEARCH_PARAM);
    } else {
      params.set(PROVENANCE_TABLE_SEARCH_PARAM, trimmed);
    }
    },
  });
}

export function provenanceTableNodeTypeHrefFromSearch(
  currentSearch: string,
  nodeType: string,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = nodeType.trim();

    if (trimmed.length === 0) {
      params.delete(PROVENANCE_TABLE_NODE_TYPE_PARAM);
    } else {
      params.set(PROVENANCE_TABLE_NODE_TYPE_PARAM, trimmed);
    }
    },
  });
}

export function parseProvenanceTableEdgeSearchQueryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function provenanceTableEdgeSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      params.delete(PROVENANCE_TABLE_EDGE_SEARCH_PARAM);
    } else {
      params.set(PROVENANCE_TABLE_EDGE_SEARCH_PARAM, trimmed);
    }
    },
  });
}
