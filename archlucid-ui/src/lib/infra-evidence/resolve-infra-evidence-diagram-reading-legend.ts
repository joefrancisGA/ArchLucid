import { INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX } from "@/lib/infra-evidence/infra-evidence-data-flow-diagram";
import {
  INFRA_EVIDENCE_DIAGRAM_DATA_ARCHITECTURE_READING_LEGEND,
  INFRA_EVIDENCE_DIAGRAM_PNG_NETWORK_PLACEMENT_NOTE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";

const DATA_FLOW_READING_HEDGE_BOXES = "This diagram shows what may connect.";
const DATA_FLOW_READING_HEDGE_CONNECTORS = "It is not observed traffic.";

export type InfraEvidenceDiagramReadingLegendLines = {
  readonly boxes: string;
  readonly connectors: string;
  readonly evidenceKind: string;
};

/** UU-19 — three answers for how to read the painted inventory diagram in the current mode. */
export function resolveInfraEvidenceDiagramReadingLegend(mode: string): InfraEvidenceDiagramReadingLegendLines {
  switch (mode) {
    case "dataFlow":
      return {
        boxes: DATA_FLOW_READING_HEDGE_BOXES,
        connectors: DATA_FLOW_READING_HEDGE_CONNECTORS,
        evidenceKind: `${INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX} Evidence kind is configuration, not observed traffic.`,
      };
    case "dataArchitecture":
      return {
        boxes: INFRA_EVIDENCE_DIAGRAM_DATA_ARCHITECTURE_READING_LEGEND,
        connectors: INFRA_EVIDENCE_DIAGRAM_DATA_ARCHITECTURE_READING_LEGEND,
        evidenceKind: "Evidence kind is configuration.",
      };
    case "network":
      return {
        boxes: INFRA_EVIDENCE_DIAGRAM_PNG_NETWORK_PLACEMENT_NOTE,
        connectors: INFRA_EVIDENCE_DIAGRAM_PNG_NETWORK_PLACEMENT_NOTE,
        evidenceKind: "Evidence kind is configuration from inventory.",
      };
    case "data":
      return {
        boxes: "Boxes are resources in this inventory view.",
        connectors: "Each connector is only as strong as its own line.",
        evidenceKind: "This view does not prove reachability or runtime use.",
      };
    case "executive":
      return {
        boxes: "Azure resources",
        connectors: "Each connector is only as strong as its own line.",
        evidenceKind: "This view does not prove reachability or runtime use.",
      };
    default:
      return {
        boxes: "Boxes are resources in this inventory view.",
        connectors: "Each connector is only as strong as its own line.",
        evidenceKind: "This view does not prove reachability or runtime use.",
      };
  }
}
