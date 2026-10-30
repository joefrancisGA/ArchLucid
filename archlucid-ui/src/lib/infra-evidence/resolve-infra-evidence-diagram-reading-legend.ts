import { INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX } from "@/lib/infra-evidence/infra-evidence-data-flow-diagram";
import {
  INFRA_EVIDENCE_DIAGRAM_DATA_ARCHITECTURE_READING_LEGEND,
  INFRA_EVIDENCE_DIAGRAM_PNG_NETWORK_PLACEMENT_NOTE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";

const DATA_FLOW_READING_HEDGE_BOXES = "This diagram shows what may connect.";
const DATA_FLOW_READING_HEDGE_CONNECTORS = "It is not observed traffic.";
const DATA_FLOW_OBSERVED_VS_DECLARED_BOXES =
  "Declared and observed connectors use different evidence families on this diagram.";
const DATA_FLOW_OBSERVED_VS_DECLARED_CONNECTORS =
  "Observed-in-logs connectors reflect diagnostic evidence; other connectors show declared configuration.";
const DATA_FLOW_OBSERVED_VS_DECLARED_EVIDENCE_KIND = `${INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX} Evidence kind mixes declared configuration with observed-in-logs edges when both appear.`;

export const EXECUTIVE_FIRST_TWELVE_DRAWN_CAPTION =
  "This view shows the first 12 resources drawn on this diagram from the collected snapshot. It is not a sponsor summary." as const;

export const EXECUTIVE_ARM_ID_ORDER_BOXES =
  "Azure resources shown in ARM resource id order (not ranked)." as const;

export type InfraEvidenceDiagramReadingLegendOptions = {
  readonly executiveOverflowStripped?: boolean;
  readonly crossGroupFanOutIncluded?: boolean;
  readonly executiveFirstTwelveDrawn?: boolean;
  readonly dataFlowHasObservedInLogs?: boolean;
};

export type InfraEvidenceDiagramReadingLegendLines = {
  readonly boxes: string;
  readonly connectors: string;
  readonly evidenceKind: string;
  readonly scopeNote?: string;
};

/** UU-19 — three answers for how to read the painted inventory diagram in the current mode. */
export function resolveInfraEvidenceDiagramReadingLegend(
  mode: string,
  options: InfraEvidenceDiagramReadingLegendOptions = {},
): InfraEvidenceDiagramReadingLegendLines {
  const executiveOverflowStripped = options.executiveOverflowStripped === true;
  const crossGroupFanOutIncluded = options.crossGroupFanOutIncluded === true;
  const executiveFirstTwelveDrawn = options.executiveFirstTwelveDrawn === true;
  const dataFlowHasObservedInLogs = options.dataFlowHasObservedInLogs === true;

  switch (mode) {
    case "dataFlow":
      return dataFlowHasObservedInLogs
        ? {
            boxes: DATA_FLOW_OBSERVED_VS_DECLARED_BOXES,
            connectors: DATA_FLOW_OBSERVED_VS_DECLARED_CONNECTORS,
            evidenceKind: DATA_FLOW_OBSERVED_VS_DECLARED_EVIDENCE_KIND,
          }
        : {
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
        boxes: executiveOverflowStripped
          ? "Azure resources — executive overflow rollups and unresolved policy outlines stay in Mermaid but are not painted here."
          : EXECUTIVE_ARM_ID_ORDER_BOXES,
        connectors: crossGroupFanOutIncluded
          ? "Each connector is only as strong as its own line."
          : "Cross-group applies and likely · fan-out edge captions are omitted from this canvas unless Show cross-group links is on.",
        evidenceKind: "This view does not prove reachability or runtime use.",
        scopeNote: executiveFirstTwelveDrawn ? EXECUTIVE_FIRST_TWELVE_DRAWN_CAPTION : undefined,
      };
    default:
      return {
        boxes: "Boxes are resources in this inventory view.",
        connectors: "Each connector is only as strong as its own line.",
        evidenceKind: "This view does not prove reachability or runtime use.",
      };
  }
}
