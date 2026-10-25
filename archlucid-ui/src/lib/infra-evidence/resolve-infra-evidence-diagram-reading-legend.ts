import { INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX } from "@/lib/infra-evidence/infra-evidence-data-flow-diagram";

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
        boxes: "Boxes are resources in this data-flow view.",
        connectors: "Connectors follow the line label. A line is not observed traffic.",
        evidenceKind: `${INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX} This view does not prove reachability or runtime use.`,
      };
    case "dataArchitecture":
      return {
        boxes: "Boxes are resources in the data-architecture view.",
        connectors:
          "Connectors are the relationships drawn for that view. They are not observed queries.",
        evidenceKind: "This view does not prove reachability or runtime use.",
      };
    case "data":
      return {
        boxes: "Boxes are resources in this inventory view.",
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
