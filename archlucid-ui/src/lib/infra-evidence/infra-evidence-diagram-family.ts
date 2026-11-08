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
  AuthorizedAccess: "Authorization may allow access",
  StructuralNetworkPath: "Private endpoint in inventory",
  AppSettingsHost: "From app settings",
  InferredHostname: "Inferred hostname. A stored link was not recorded.",
  HumanConfirmed: "Confirmed connection",
  ObservedRuntime: "Dependency named in inventory",
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
  "inventory-static-site-backend": "DeclaredMovement",
  "inventory-fabric-capacity-workspace": "DeclaredMovement",
  "inventory-diagnostic-setting-storage": "DeclaredMovement",
};

function resolveFamilyFromLabel(label: string): InfraEvidenceDiagramFamily | null {
  const normalized = label.trim().toLowerCase();

  if (
    normalized.includes("authorization may allow access")
    || normalized.includes("sql principal authorization")
    || normalized.includes("may access")
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

  if (normalized.includes("app setting hostname was inferred") || normalized.includes("from app settings")) {
    return "AppSettingsHost";
  }

  if (
    normalized.includes("inferred hostname")
    || normalized.includes("likely connected")
    || normalized.includes("hostname")
  ) {
    return "InferredHostname";
  }

  if (normalized.includes("service connector is configured")) {
    return "DeclaredMovement";
  }

  if (
    normalized === "linked backend"
    || normalized === "assigned workspace"
    || normalized.includes("diagnostic setting")
  ) {
    return "DeclaredMovement";
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

/** Keeps deep-linked family chips from stranding the workbench when the current diagram has no edges in that family. */
export function resolveSelectableInfraEvidenceDiagramFamily(
  selected: InfraEvidenceDiagramFamily,
  availableFamilies: readonly InfraEvidenceDiagramFamily[],
): InfraEvidenceDiagramFamily {
  if (selected === INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL) {
    return selected;
  }

  return availableFamilies.includes(selected) ? selected : INFRA_EVIDENCE_DIAGRAM_FAMILY_ALL;
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
