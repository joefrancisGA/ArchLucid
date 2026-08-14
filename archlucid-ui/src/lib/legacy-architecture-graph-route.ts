import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

/** Legacy Operate bookmark path — client canonicalization only (IA batch 4; no HTTP redirect). */
export const LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH = "/operate/architecture-graph";

/** Canonical Evidence graph tracked on traffic row INE. */
export const CANONICAL_GRAPH_PATH = EVIDENCE_GRAPH_PATH;
