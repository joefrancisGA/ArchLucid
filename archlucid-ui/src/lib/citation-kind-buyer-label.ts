import type { CitationReference } from "@/types/explanation";

import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

/**
 * Maps persisted citation `kind` to buyer-facing chip labels (avoids exposing internal enum names).
 */
export function citationKindBuyerLabel(kind: CitationReference["kind"]): string {
  switch (kind) {
    case "GraphSnapshot":
      return BUYER_SURFACE_VOCABULARY.evidenceGraph;
    case "ContextSnapshot":
      return "Reviewed source context";
    case "DecisionTrace":
      return "Decision record";
    case "Manifest":
      return SIGNED_MANIFEST_LABEL;
    case "Finding":
      return "Finding";
    case "EvidenceBundle":
      return "Evidence bundle";
    default:
      return kind;
  }
}

/** Maps provenance graph node `type` strings to buyer-facing labels (demo explain, trail panels). */
export function provenanceGraphNodeTypeBuyerLabel(nodeType: string): string {
  switch (nodeType) {
    case "Manifest":
    case "GoldenManifest":
      return SIGNED_MANIFEST_LABEL;
    case "Review":
      return "Review";
    case "Finding":
      return "Finding";
    case "GraphSnapshot":
      return BUYER_SURFACE_VOCABULARY.evidenceGraph;
    case "ContextSnapshot":
      return "Reviewed source context";
    default:
      return nodeType;
  }
}
