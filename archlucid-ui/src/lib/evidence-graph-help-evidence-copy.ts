import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  EVIDENCE_GRAPH_CANONICAL_PATH,
  EVIDENCE_GRAPH_CLAIM_DISCIPLINE,
  EVIDENCE_GRAPH_SOURCES,
  EVIDENCE_GRAPH_SOURCES_INTRO,
} from "@/lib/evidence-graph-evidence-copy";

export const EVIDENCE_GRAPH_HELP_CANONICAL_PATH = "/help/evidence-graph" as const;

export const EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE =
  "This guide explains how the evidence graph relates findings, decisions, and audit records — it is not a sealed-review diligence Sources package.";

export const EVIDENCE_GRAPH_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const EVIDENCE_GRAPH_HELP_SOURCES_INTRO = EVIDENCE_GRAPH_SOURCES_INTRO;

export const EVIDENCE_GRAPH_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Evidence graph", href: EVIDENCE_GRAPH_CANONICAL_PATH },
  ...EVIDENCE_GRAPH_SOURCES,
] as const;

export const EVIDENCE_GRAPH_HELP_OPERATOR_CLAIM = EVIDENCE_GRAPH_CLAIM_DISCIPLINE;
