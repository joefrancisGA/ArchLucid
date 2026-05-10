import type { CitationReference } from "@/types/explanation";

import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

/**
 * Maps persisted citation `kind` to buyer-facing chip labels (avoids exposing internal enum names).
 */
export function citationKindBuyerLabel(kind: CitationReference["kind"]): string {
  switch (kind) {
    case "GraphSnapshot":
      return BUYER_SURFACE_VOCABULARY.evidenceGraph;
    case "ContextSnapshot":
      return "Context snapshot";
    case "DecisionTrace":
      return "Decision record";
    case "Manifest":
      return "Reviewed manifest";
    case "Finding":
      return "Finding";
    case "EvidenceBundle":
      return "Evidence bundle";
    default:
      return kind;
  }
}
