import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
import type {
  FindingEvidenceGraphPresentationMode,
  FindingEvidenceGraphViewMode,
} from "@/lib/findings/finding-evidence-graph-highlight";

export const FINDING_EVIDENCE_GRAPH_VIEW_PARAM = "evGraphView";
export const FINDING_EVIDENCE_GRAPH_PRESENTATION_PARAM = "evPresentation";

const FINDING_EVIDENCE_GRAPH_VIEW_IDS = new Set<string>(["context", "reasoningPath"]);
const FINDING_EVIDENCE_GRAPH_PRESENTATION_IDS = new Set<string>(["graph", "outline"]);

export type FindingEvidenceGraphViewUrlState = {
  readonly viewMode: FindingEvidenceGraphViewMode | null;
  readonly presentationMode: FindingEvidenceGraphPresentationMode | null;
};

export function parseFindingEvidenceGraphViewFromSearch(
  raw: string | null | undefined,
): FindingEvidenceGraphViewMode | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!FINDING_EVIDENCE_GRAPH_VIEW_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as FindingEvidenceGraphViewMode;
}

export function parseFindingEvidenceGraphPresentationFromSearch(
  raw: string | null | undefined,
): FindingEvidenceGraphPresentationMode | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!FINDING_EVIDENCE_GRAPH_PRESENTATION_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as FindingEvidenceGraphPresentationMode;
}

export function findingEvidenceGraphViewHrefFromSearch(
  currentSearch: string,
  state: FindingEvidenceGraphViewUrlState,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (state.viewMode === null || state.viewMode === "context") {
      params.delete(FINDING_EVIDENCE_GRAPH_VIEW_PARAM);
    } else {
      params.set(FINDING_EVIDENCE_GRAPH_VIEW_PARAM, state.viewMode);
    }

    if (state.presentationMode === null || state.presentationMode === "graph") {
      params.delete(FINDING_EVIDENCE_GRAPH_PRESENTATION_PARAM);
    } else {
      params.set(FINDING_EVIDENCE_GRAPH_PRESENTATION_PARAM, state.presentationMode);
    }
    },
  });
}
