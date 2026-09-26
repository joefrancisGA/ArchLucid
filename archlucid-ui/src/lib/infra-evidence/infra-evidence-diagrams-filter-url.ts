import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import {
  formatInfraDiagramsHiddenExecutiveTierKeysForSearch,
  parseInfraDiagramsHiddenExecutiveTierKeysFromSearch,
} from "@/lib/infra-evidence/infra-evidence-diagrams-executive-tiers";
import {
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
  RESOURCE_HUB_RUN_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";

export const INFRA_DIAGRAMS_SNAPSHOT_ID_PARAM = "snapshotId";
export const INFRA_DIAGRAMS_CLOUD_RESOURCE_ID_PARAM = "cloudResourceId";
export const INFRA_DIAGRAMS_MERMAID_MODE_PARAM = "mermaidMode";
export const INFRA_DIAGRAMS_MERMAID_VIEW_PARAM = "mermaidView";
export const INFRA_DIAGRAMS_SEED_NODE_ID_PARAM = "seedNodeId";
export const INFRA_DIAGRAMS_INCLUDE_NEVER_SHOW_PARAM = "includeNeverShow";
export const INFRA_DIAGRAMS_HIDE_EXECUTIVE_TIERS_PARAM = "hideTiers";
export const INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_PARAM = "diagramSubscription";
export const INFRA_DIAGRAMS_INCLUDE_PRIVATE_ENDPOINTS_PARAM = "includePrivateEndpoints";
export const INFRA_DIAGRAMS_INCLUDE_RECOVERY_SERVICES_PARAM = "includeRecoveryServices";
export const INFRA_DIAGRAMS_INCLUDE_CROSS_GROUP_FAN_OUT_PARAM = "includeCrossGroupFanOut";

/** @deprecated Legacy URL param; parsed as alias for {@link INFRA_DIAGRAMS_INCLUDE_NEVER_SHOW_PARAM}. */
export const INFRA_DIAGRAMS_SHOW_TRIVIAL_COMPONENTS_PARAM = "showTrivialComponents";

export const INFRA_DIAGRAMS_DEFAULT_MODE = "executive";

export const INFRA_DIAGRAMS_MODE_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: "executive", label: "Executive" },
  { value: "architecture", label: "Architecture" },
  { value: "network", label: "Network" },
  { value: "security", label: "Security" },
  { value: "businessContinuity", label: "Business continuity" },
  { value: "identity", label: "Identity" },
  { value: "data", label: "Data category" },
  { value: "dataFlow", label: "Data flow — what may connect" },
  { value: "dataArchitecture", label: "Data architecture — what stores what" },
  { value: "avd", label: "Azure Virtual Desktop" },
  { value: "full", label: "Full subscription" },
  { value: "resourceGroup", label: "Pick a Resource Group" },
  { value: "selectedResources", label: "Selected resources" },
  { value: "dependencyNeighborhood", label: "Dependency neighborhood" },
];

const ALLOWED_MODES = new Set(INFRA_DIAGRAMS_MODE_OPTIONS.map((option) => option.value));

/** Diagram type picker — resource group and selected-resource scopes use separate controls or entry points. */
export const INFRA_DIAGRAMS_DIAGRAM_TYPE_OPTIONS = INFRA_DIAGRAMS_MODE_OPTIONS.filter(
  (option) => option.value !== "resourceGroup" && option.value !== "selectedResources",
);

function resolveInfraDiagramsMermaidMode(raw: string): string {
  const trimmed = raw.trim();

  if (ALLOWED_MODES.has(trimmed)) {
    return trimmed;
  }

  const canonical = INFRA_DIAGRAMS_MODE_OPTIONS.find(
    (option) => option.value.toLowerCase() === trimmed.toLowerCase(),
  );

  return canonical?.value ?? "";
}

export function isInfraDiagramsMermaidModeSelected(mode: string | null | undefined): boolean {
  const trimmed = mode?.trim() ?? "";

  return trimmed.length > 0 && ALLOWED_MODES.has(trimmed);
}

export function parseInfraDiagramsSnapshotIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

/**
 * Honor a deep-linked snapshot only when it is in the loaded catalog.
 * Do not fall back to the first listed snapshot — the operator must choose one.
 */
export function resolveInfraDiagramsSelectedSnapshotId(
  urlSnapshotId: string,
  snapshots: readonly { readonly snapshotId: string }[],
): string {
  const trimmed = urlSnapshotId.trim();

  if (trimmed.length === 0) {
    return "";
  }

  if (!snapshots.some((snapshot) => snapshot.snapshotId === trimmed)) {
    return "";
  }

  return trimmed;
}

export function parseInfraDiagramsCloudResourceIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseInfraDiagramsMermaidModeFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return "";
  }

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

function parseTruthyDiagramSearchParam(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const normalized = raw.trim().toLowerCase();

  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function parseInfraDiagramsHiddenExecutiveTierKeysFromSearchParam(
  raw: string | null | undefined,
): readonly string[] {
  return parseInfraDiagramsHiddenExecutiveTierKeysFromSearch(raw);
}

export function parseInfraDiagramsIncludeNeverShowFromSearch(
  includeNeverShowRaw: string | null | undefined,
  legacyShowTrivialRaw?: string | null | undefined,
): boolean {
  if (parseTruthyDiagramSearchParam(includeNeverShowRaw)) {
    return true;
  }

  return parseTruthyDiagramSearchParam(legacyShowTrivialRaw);
}

export function parseInfraDiagramsSubscriptionFilterFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseInfraDiagramsIncludePrivateEndpointsFromSearch(raw: string | null | undefined): boolean {
  return parseTruthyDiagramSearchParam(raw);
}

export function parseInfraDiagramsIncludeRecoveryServicesFromSearch(raw: string | null | undefined): boolean {
  return parseTruthyDiagramSearchParam(raw);
}

export function parseInfraDiagramsIncludeCrossGroupFanOutFromSearch(raw: string | null | undefined): boolean {
  return parseTruthyDiagramSearchParam(raw);
}

/** @deprecated Use {@link parseInfraDiagramsIncludeNeverShowFromSearch}. */
export function parseInfraDiagramsShowTrivialComponentsFromSearch(raw: string | null | undefined): boolean {
  return parseInfraDiagramsIncludeNeverShowFromSearch(raw);
}

export type InfraDiagramsWorkbenchContext = {
  readonly snapshotId?: string | null;
  readonly cloudResourceId?: string | null;
  readonly mermaidMode?: string | null;
  readonly mermaidView?: string | null;
  readonly seedNodeId?: string | null;
  readonly includeNeverShow?: boolean | null;
  readonly hiddenExecutiveTierKeys?: readonly string[] | null;
  readonly subscriptionFilter?: string | null;
  readonly includePrivateEndpoints?: boolean | null;
  readonly includeRecoveryServices?: boolean | null;
  readonly includeCrossGroupFanOut?: boolean | null;
  readonly runId?: string | null;
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
    includeNeverShow: context.includeNeverShow ?? undefined,
    hiddenExecutiveTierKeys: context.hiddenExecutiveTierKeys ?? undefined,
    subscriptionFilter: context.subscriptionFilter ?? undefined,
    includePrivateEndpoints: context.includePrivateEndpoints ?? undefined,
    includeRecoveryServices: context.includeRecoveryServices ?? undefined,
    includeCrossGroupFanOut: context.includeCrossGroupFanOut ?? undefined,
    runId: context.runId ?? undefined,
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
    readonly includeNeverShow?: boolean;
    readonly hiddenExecutiveTierKeys?: readonly string[];
    readonly subscriptionFilter?: string;
    readonly includePrivateEndpoints?: boolean;
    readonly includeRecoveryServices?: boolean;
    readonly includeCrossGroupFanOut?: boolean;
    readonly runId?: string;
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
    const trimmedMode = patch.mermaidMode.trim();

    if (trimmedMode.length === 0) {
      params.delete(INFRA_DIAGRAMS_MERMAID_MODE_PARAM);
    } else {
      const resolved = resolveInfraDiagramsMermaidMode(trimmedMode);

      if (resolved.length === 0) {
        params.delete(INFRA_DIAGRAMS_MERMAID_MODE_PARAM);
      } else {
        params.set(INFRA_DIAGRAMS_MERMAID_MODE_PARAM, resolved);
      }
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

  if (patch.includeNeverShow !== undefined) {
    params.delete(INFRA_DIAGRAMS_SHOW_TRIVIAL_COMPONENTS_PARAM);

    if (patch.includeNeverShow) {
      params.set(INFRA_DIAGRAMS_INCLUDE_NEVER_SHOW_PARAM, "1");
    } else {
      params.delete(INFRA_DIAGRAMS_INCLUDE_NEVER_SHOW_PARAM);
    }
  }

  if (patch.hiddenExecutiveTierKeys !== undefined) {
    const formatted = formatInfraDiagramsHiddenExecutiveTierKeysForSearch(patch.hiddenExecutiveTierKeys);

    if (formatted.length === 0) {
      params.delete(INFRA_DIAGRAMS_HIDE_EXECUTIVE_TIERS_PARAM);
    } else {
      params.set(INFRA_DIAGRAMS_HIDE_EXECUTIVE_TIERS_PARAM, formatted);
    }
  }

  if (patch.subscriptionFilter !== undefined) {
    const trimmed = patch.subscriptionFilter.trim();

    if (trimmed.length === 0) {
      params.delete(INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_PARAM);
    } else {
      params.set(INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_PARAM, trimmed);
    }
  }

  if (patch.includePrivateEndpoints !== undefined) {
    if (patch.includePrivateEndpoints) {
      params.set(INFRA_DIAGRAMS_INCLUDE_PRIVATE_ENDPOINTS_PARAM, "1");
    } else {
      params.delete(INFRA_DIAGRAMS_INCLUDE_PRIVATE_ENDPOINTS_PARAM);
    }
  }

  if (patch.includeRecoveryServices !== undefined) {
    if (patch.includeRecoveryServices) {
      params.set(INFRA_DIAGRAMS_INCLUDE_RECOVERY_SERVICES_PARAM, "1");
    } else {
      params.delete(INFRA_DIAGRAMS_INCLUDE_RECOVERY_SERVICES_PARAM);
    }
  }

  if (patch.includeCrossGroupFanOut !== undefined) {
    if (patch.includeCrossGroupFanOut) {
      params.set(INFRA_DIAGRAMS_INCLUDE_CROSS_GROUP_FAN_OUT_PARAM, "1");
    } else {
      params.delete(INFRA_DIAGRAMS_INCLUDE_CROSS_GROUP_FAN_OUT_PARAM);
    }
  }

  if (patch.runId !== undefined) {
    const trimmed = patch.runId.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_HUB_RUN_ID_PARAM);
    } else {
      params.set(RESOURCE_HUB_RUN_ID_PARAM, trimmed);
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
