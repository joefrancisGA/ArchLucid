import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { DIAGRAM_INFRASTRUCTURE_MATCH_KINDS } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";

export type DiagramReconcileOverlayMatch = {
  readonly nodeId: string;
  readonly matchKind: string;
};

export type DiagramReconcileOverlayStyle = {
  readonly statusKind: EnterpriseStatusKind;
  readonly stroke: string;
  readonly strokeWidth: string;
};

export function resolveDiagramReconcileOverlayStyle(matchKind: string): DiagramReconcileOverlayStyle {
  switch (matchKind) {
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.confirmed:
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.exact:
      return { statusKind: "ready", stroke: "var(--al-status-ready-fg)", strokeWidth: "3" };
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.probable:
      return { statusKind: "in-progress", stroke: "var(--al-accent-interactive)", strokeWidth: "3" };
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.possible:
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.unknown:
      return { statusKind: "neutral", stroke: "var(--al-status-neutral-fg)", strokeWidth: "2" };
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.diagramOnly:
      return { statusKind: "needs-attention", stroke: "var(--al-status-warn-fg)", strokeWidth: "3" };
    case DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.conflict:
      return { statusKind: "blocked", stroke: "var(--al-status-blocked-fg)", strokeWidth: "4" };
    default:
      return { statusKind: "neutral", stroke: "var(--al-status-neutral-fg)", strokeWidth: "2" };
  }
}

export function findDiagramReconcileOverlayMatch(
  matches: readonly DiagramReconcileOverlayMatch[],
  nodeId: string,
): DiagramReconcileOverlayMatch | null {
  return matches.find((match) => match.nodeId === nodeId) ?? null;
}
