import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH } from "@/lib/governance/governance-infrastructure-route-paths";

export const INFRA_DIAGRAMS_SNAPSHOT_ID_PARAM = "snapshotId";
export const INFRA_DIAGRAMS_MERMAID_MODE_PARAM = "mermaidMode";
export const INFRA_DIAGRAMS_MERMAID_VIEW_PARAM = "mermaidView";
export const INFRA_DIAGRAMS_SEED_NODE_ID_PARAM = "seedNodeId";

export const INFRA_DIAGRAMS_DEFAULT_MODE = "executive";

export const INFRA_DIAGRAMS_MODE_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: "executive", label: "Executive" },
  { value: "network", label: "Network" },
  { value: "identity", label: "Identity" },
  { value: "data", label: "Data" },
  { value: "full", label: "Full subscription" },
  { value: "dependencyNeighborhood", label: "Dependency neighborhood" },
];

const ALLOWED_MODES = new Set(INFRA_DIAGRAMS_MODE_OPTIONS.map((option) => option.value));

export function parseInfraDiagramsSnapshotIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseInfraDiagramsMermaidModeFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return INFRA_DIAGRAMS_DEFAULT_MODE;
  }

  const trimmed = raw.trim().toLowerCase();

  if (ALLOWED_MODES.has(trimmed)) {
    return trimmed;
  }

  return INFRA_DIAGRAMS_DEFAULT_MODE;
}

export function parseInfraDiagramsMermaidViewFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseInfraDiagramsSeedNodeIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function infraDiagramsFilterHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly snapshotId?: string;
    readonly mermaidMode?: string;
    readonly mermaidView?: string;
    readonly seedNodeId?: string;
  },
  pathname: string = GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.snapshotId !== undefined) {
    const trimmed = patch.snapshotId.trim();

    if (trimmed.length === 0) {
      params.delete(INFRA_DIAGRAMS_SNAPSHOT_ID_PARAM);
    } else {
      params.set(INFRA_DIAGRAMS_SNAPSHOT_ID_PARAM, trimmed);
    }
  }

  if (patch.mermaidMode !== undefined) {
    const trimmed = patch.mermaidMode.trim().toLowerCase();
    const resolved = ALLOWED_MODES.has(trimmed) ? trimmed : INFRA_DIAGRAMS_DEFAULT_MODE;

    if (resolved === INFRA_DIAGRAMS_DEFAULT_MODE) {
      params.delete(INFRA_DIAGRAMS_MERMAID_MODE_PARAM);
    } else {
      params.set(INFRA_DIAGRAMS_MERMAID_MODE_PARAM, resolved);
    }
  }

  if (patch.mermaidView !== undefined) {
    const trimmed = patch.mermaidView.trim();

    if (trimmed.length === 0) {
      params.delete(INFRA_DIAGRAMS_MERMAID_VIEW_PARAM);
    } else {
      params.set(INFRA_DIAGRAMS_MERMAID_VIEW_PARAM, trimmed);
    }
  }

  if (patch.seedNodeId !== undefined) {
    const trimmed = patch.seedNodeId.trim();

    if (trimmed.length === 0) {
      params.delete(INFRA_DIAGRAMS_SEED_NODE_ID_PARAM);
    } else {
      params.set(INFRA_DIAGRAMS_SEED_NODE_ID_PARAM, trimmed);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
