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
        boxes: "Boxes are resources on a declared path.",
        connectors: "Connectors are declared wiring.",
        evidenceKind: `${INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX} Evidence kind is configuration, not observed traffic.`,
      };
    case "dataArchitecture":
      return {
        boxes: "Boxes are data stores.",
        connectors: "Connectors are declared repository relationships.",
        evidenceKind: "Evidence kind is configuration.",
      };
    case "data":
      return {
        boxes: "Boxes are data resources in the infrastructure forest.",
        connectors: "Connectors are the forest relationships already drawn.",
        evidenceKind: "Evidence kind is configuration.",
      };
    default:
      return {
        boxes: "Boxes are cloud resources in this inventory view (Azure when the snapshot is Azure).",
        connectors: "Connectors are relationships already on the diagram.",
        evidenceKind: "Evidence kind is configuration from inventory — not live cloud telemetry.",
      };
  }
}
