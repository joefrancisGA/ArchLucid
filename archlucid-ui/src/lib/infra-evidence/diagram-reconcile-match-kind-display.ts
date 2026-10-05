import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { DIAGRAM_INFRASTRUCTURE_MATCH_KINDS } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";
import {
  resolveDiagramCorrespondenceConfidenceStatusKind,
  resolveDiagramCorrespondenceStatusKind,
} from "@/lib/infra-evidence/infra-evidence-resource-hub-display";

/** Operator-facing label for diagram ↔ inventory match kind values. */
export function formatDiagramReconcileMatchKindLabel(matchKind: string): string {
  const normalized = matchKind.trim();

  switch (normalized) {
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.exact:
      return "Exact match";
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.probable:
      return "Probable match";
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.possible:
      return "Possible match";
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.diagramOnly:
      return "Diagram only";
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.infrastructureOnly:
      return "Inventory only";
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.conflict:
      return "Conflict";
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.unknown:
      return "Unknown";
    default:
      return normalized.length > 0 ? normalized : "Not recorded";
  }
}

export function resolveDiagramReconcileMatchKindStatusKind(matchKind: string): EnterpriseStatusKind {
  return resolveDiagramCorrespondenceStatusKind(matchKind, "Confirmed");
}

export function resolveDiagramReconcileConfidenceStatusKind(confidenceBand: string): EnterpriseStatusKind {
  return resolveDiagramCorrespondenceConfidenceStatusKind(confidenceBand);
}

/** Operator-facing label for connector gap kind on reconciliation results. */
export function formatDiagramReconcileEdgeGapKindLabel(gapKind: string): string {
  const normalized = gapKind.trim();

  if (normalized.length === 0) {
    return "Gap not classified";
  }

  switch (normalized) {
    case "MissingInDiagram":
      return "Missing in diagram";
    case "MissingInInventory":
      return "Missing in inventory";
    case "AssociationMismatch":
      return "Association mismatch";
    default:
      return normalized;
  }
}
