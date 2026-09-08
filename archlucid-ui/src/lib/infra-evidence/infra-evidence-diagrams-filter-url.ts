import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import {
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";

export const INFRA_DIAGRAMS_SNAPSHOT_ID_PARAM = "snapshotId";
export const INFRA_DIAGRAMS_CLOUD_RESOURCE_ID_PARAM = "cloudResourceId";
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

function resolveInfraDiagramsMermaidMode(raw: string): string {
  const trimmed = raw.trim();

  if (ALLOWED_MODES.has(trimmed)) {
    return trimmed;
  }

  const canonical = INFRA_DIAGRAMS_MODE_OPTIONS.find(
    (option) => option.value.toLowerCase() === trimmed.toLowerCase(),
  );

  return canonical?.value ?? INFRA_DIAGRAMS_DEFAULT_MODE;
}

export function parseInfraDiagramsSnapshotIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseInfraDiagramsCloudResourceIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseInfraDiagramsMermaidModeFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return INFRA_DIAGRAMS_DEFAULT_MODE;
  }

  const trimmed = raw.trim();

  return resolveInfraDiagramsMermaidMode(trimmed);
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

export type InfraDiagramsWorkbenchContext = {
  readonly snapshotId?: string | null;
  readonly cloudResourceId?: string | null;
  readonly mermaidMode?: string | null;
  readonly mermaidView?: string | null;
  readonly seedNodeId?: string | null;
  readonly assessmentId?: string | null;
  readonly auditEvidenceSnapshotId?: string | null;
  readonly controlId?: string | null;
};

export function buildDiagramsWorkbenchHref(context: InfraDiagramsWorkbenchContext = {}): string {
  return infraDiagramsFilterHrefFromSearch("", {
    snapshotId: context.snapshotId ?? undefined,
    cloudResourceId: context.cloudResourceId ?? undefined,
    mermaidMode: context.mermaidMode ?? undefined,
    mermaidView: context.mermaidView ?? undefined,
    seedNodeId: context.seedNodeId ?? undefined,
    assessmentId: context.assessmentId ?? undefined,
    auditEvidenceSnapshotId: context.auditEvidenceSnapshotId ?? undefined,
    controlId: context.controlId ?? undefined,
  });
}

export function infraDiagramsFilterHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly snapshotId?: string;
    readonly cloudResourceId?: string;
    readonly mermaidMode?: string;
    readonly mermaidView?: string;
    readonly seedNodeId?: string;
    readonly assessmentId?: string;
    readonly auditEvidenceSnapshotId?: string;
    readonly controlId?: string;
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

  if (patch.cloudResourceId !== undefined) {
    const trimmed = patch.cloudResourceId.trim();

    if (trimmed.length === 0) {
      params.delete(INFRA_DIAGRAMS_CLOUD_RESOURCE_ID_PARAM);
    } else {
      params.set(INFRA_DIAGRAMS_CLOUD_RESOURCE_ID_PARAM, trimmed);
    }
  }

  if (patch.mermaidMode !== undefined) {
    const resolved = resolveInfraDiagramsMermaidMode(patch.mermaidMode);

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

  if (patch.assessmentId !== undefined) {
    const trimmed = patch.assessmentId.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_HUB_ASSESSMENT_ID_PARAM);
    } else {
      params.set(RESOURCE_HUB_ASSESSMENT_ID_PARAM, trimmed);
    }
  }

  if (patch.auditEvidenceSnapshotId !== undefined) {
    const trimmed = patch.auditEvidenceSnapshotId.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM);
    } else {
      params.set(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM, trimmed);
    }
  }

  if (patch.controlId !== undefined) {
    const trimmed = patch.controlId.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_HUB_CONTROL_ID_PARAM);
    } else {
      params.set(RESOURCE_HUB_CONTROL_ID_PARAM, trimmed);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
