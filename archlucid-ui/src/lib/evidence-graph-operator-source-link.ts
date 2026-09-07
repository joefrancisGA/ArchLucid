import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

/** Canonical operator Sources row for the Evidence graph surface (PC-12 / TB-2097). */
export const EVIDENCE_GRAPH_OPERATOR_SOURCE_LINK: EvidenceSourceLink = {
  label: BUYER_SURFACE_VOCABULARY.evidenceGraph,
  href: EVIDENCE_GRAPH_PATH,
};

/** Action-link label when deep-linking into the graph from search or retrieval hits. */
export const EVIDENCE_GRAPH_OPEN_ACTION_LABEL = `Open ${BUYER_SURFACE_VOCABULARY.evidenceGraph.toLowerCase()}` as const;
