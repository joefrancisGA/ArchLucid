import type { InfraEvidenceMermaidOutline, InfraEvidenceMermaidOutlineEdge } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export const INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL = "all" as const;

export const INFRA_EVIDENCE_DIAGRAM_FAMILIES = [
  "DeclaredMovement",
  "AuthorizedAccess",
  "StructuralNetworkPath",
  "AppSettingsHost",
  "InferredHostname",
  "HumanConfirmed",
  "ObservedRuntime",
] as const;

export type InfraEvidenceDiagramFamily =
  | typeof INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL
  | (typeof INFRA_EVIDENCE_DIAGRAM_FAMILIES)[number];

export const INFRA_EVIDENCE_DIAGRAM_FAMILY_LABELS: Readonly<Record<InfraEvidenceDiagramFamily, string>> = {
  all: "All",
  DeclaredMovement: "Pipeline wiring",
  AuthorizedAccess: "May access",
  StructuralNetworkPath: "Private network path",
  AppSettingsHost: "From app settings",
  InferredHostname: "Likely connected",
  HumanConfirmed: "Confirmed connection",
  ObservedRuntime: "Observed in logs",
};

const FAMILY_BY_INFERENCE_SOURCE: Readonly<Record<string, InfraEvidenceDiagramFamily>> = {
  "inventory-adf-linked-service": "DeclaredMovement",
  "inventory-adf-linked-service-inferred": "InferredHostname",
  "inventory-app-authorized-access": "AuthorizedAccess",
  "inventory-app-key-vault-ref": "AuthorizedAccess",
  "inventory-event-grid-destination": "DeclaredMovement",
  "inventory-hostname-inferred-target": "AppSettingsHost",
  "inventory-storage-host-ref": "AppSettingsHost",
  "inventory-observed-dependency": "ObservedRuntime",
  "inventory-operator-confirmed-connection": "HumanConfirmed",
  "inventory-pe-reachable-target": "StructuralNetworkPath",
  "inventory-private-endpoint": "StructuralNetworkPath",
  "inventory-service-connector-link": "DeclaredMovement",
};

function resolveFamilyFromLabel(label: string): InfraEvidenceDiagramFamily | null {
  const normalized = label.trim().toLowerCase();

  if (
    normalized.includes("may access")
    || normalized.includes("may publish")
    || normalized.includes("may consume")
    || normalized.includes("may send")
    || normalized.includes("may receive")
  ) {
    return "AuthorizedAccess";
  }

  if (normalized.includes("private network path") || normalized.includes("private endpoint")) {
    return "StructuralNetworkPath";
  }

  if (normalized.includes("from app settings")) {
    return "AppSettingsHost";
  }

  if (normalized.includes("likely connected") || normalized.includes("hostname")) {
    return "InferredHostname";
  }

  if (normalized.includes("confirmed connection")) {
    return "HumanConfirmed";
  }

  if (normalized.includes("observed in logs")) {
    return "ObservedRuntime";
  }

  if (
    normalized.includes("reads from")
    || normalized.includes("writes to")
    || normalized.includes("routes")
    || normalized.includes("captures")
    || normalized.includes("forwards")
    || normalized === "uses"
  ) {
    return "DeclaredMovement";
  }

  if (normalized === "api connection") {
    return INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL;
  }

  return null;
}

export function resolveInfraEvidenceDiagramFamily(
  edge: InfraEvidenceMermaidOutlineEdge,
): InfraEvidenceDiagramFamily {
  const inferenceSource = edge.inferenceSource?.trim().toLowerCase() ?? "";
  const sourceFamily = FAMILY_BY_INFERENCE_SOURCE[inferenceSource];

  if (sourceFamily !== undefined) {
    return sourceFamily;
  }

  return resolveFamilyFromLabel(edge.label ?? "") ?? INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL;
}

export function filterInfraEvidenceDiagramOutlineByFamily(
  outline: InfraEvidenceMermaidOutline,
  family: InfraEvidenceDiagramFamily,
): InfraEvidenceMermaidOutline {
  if (family === INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL) {
    return outline;
  }

  return {
    ...outline,
    edges: outline.edges.filter((edge) => resolveInfraEvidenceDiagramFamily(edge) === family),
  };
}
