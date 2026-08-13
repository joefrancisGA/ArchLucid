import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const EVIDENCE_TRAIL_HELP_CANONICAL_PATH = "/help/evidence-trail" as const;

export const EVIDENCE_TRAIL_HELP_TOPIC_LABEL = "How the evidence trail works" as const;

export const EVIDENCE_TRAIL_HELP_PRIMARY_ACTION = {
  label: "Open Evidence graph",
  href: EVIDENCE_GRAPH_PATH,
  testId: "help-evidence-trail-open-graph",
} as const;

export const EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE =
  "This Evidence graph guide is architect orientation for tracing findings, artifacts, and provenance — it is not a signed-review diligence Sources package. Open the live Evidence graph, Validate review, or Audit when you need workspace packages or assurance claims.";

export const EVIDENCE_TRAIL_HELP_SOURCES_INTRO =
  "Use these follow-ups when evidence-trail vocabulary turns into the live graph, search, provenance validation, or findings triage.";


/** Operator Sources — no self-href to `/help/evidence-trail`. */
export const EVIDENCE_TRAIL_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Evidence graph", href: EVIDENCE_GRAPH_PATH },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Validate review", href: "/internal/replay" },
  { label: "Findings help", href: inAppHelpHref("findings") },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "Demo explain", href: "/demo/explain" },
] as const;
