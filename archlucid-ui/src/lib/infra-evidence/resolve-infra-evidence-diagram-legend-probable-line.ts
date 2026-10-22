import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_WITH_LOGIC_APP,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

const LOGIC_APP_CONNECTION_SOURCE = "inventory-logic-app-connection";

export function resolveInfraEvidenceDiagramLegendProbableLine(
  outline: InfraEvidenceMermaidOutline | null | undefined,
): string {
  const hasLogicAppConnection =
    outline?.edges.some(
      (edge) => edge.inferenceSource?.trim().toLowerCase() === LOGIC_APP_CONNECTION_SOURCE,
    ) === true;

  if (hasLogicAppConnection) {
    return INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_WITH_LOGIC_APP;
  }

  return INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE;
}
