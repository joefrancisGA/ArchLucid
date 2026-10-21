import type { EvidenceTrailPresentationView } from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const GRAPH_PRESENTATION_PARAM = "presentation";

const PRESENTATION_IDS = new Set<string>(["graph", "trace"]);

export function parseGraphPresentationViewFromSearch(
  raw: string | null | undefined,
): EvidenceTrailPresentationView | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!PRESENTATION_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as EvidenceTrailPresentationView;
}

export function graphPresentationViewHrefFromSearch(
  currentSearch: string,
  presentation: EvidenceTrailPresentationView | null,
  pathname: string = EVIDENCE_GRAPH_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (presentation === null) {
      params.delete(GRAPH_PRESENTATION_PARAM);
    } else {
      params.set(GRAPH_PRESENTATION_PARAM, presentation);
    }
    },
  });
}
