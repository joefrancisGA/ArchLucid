import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_PRIVATE_ENDPOINT_DNS,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_WITH_LOGIC_APP,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

const LOGIC_APP_CONNECTION_SOURCE = "inventory-logic-app-connection";
const PRIVATE_ENDPOINT_REACHABILITY_SOURCE = "inventory-pe-reachable-target";

export function resolveInfraEvidenceDiagramLegendProbableLine(
  outline: InfraEvidenceMermaidOutline | null | undefined,
): string {
  const hasPrivateEndpointReachability =
    outline?.edges.some(
      (edge) => edge.inferenceSource?.trim().toLowerCase() === PRIVATE_ENDPOINT_REACHABILITY_SOURCE,
    ) === true;

  if (hasPrivateEndpointReachability) {
    return INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_PRIVATE_ENDPOINT_DNS;
  }

  const hasLogicAppConnection =
    outline?.edges.some(
      (edge) => edge.inferenceSource?.trim().toLowerCase() === LOGIC_APP_CONNECTION_SOURCE,
    ) === true;

  if (hasLogicAppConnection) {
    return INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE_WITH_LOGIC_APP;
  }

  return INFRA_EVIDENCE_DIAGRAM_LEGEND_PROBABLE;
}
