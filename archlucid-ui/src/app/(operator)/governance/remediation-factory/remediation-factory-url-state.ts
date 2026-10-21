import { navHrefPathPart } from "@/lib/nav-href-path-part";
import { applyOperatorUrlSelectionSwitch } from "@/lib/operator/operator-url-selection-switch";

export const REMEDIATION_FACTORY_FINDING_ID_PARAM = "findingId" as const;
export const REMEDIATION_FACTORY_PATH_ID_PARAM = "pathId" as const;
export const REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM = "fromSnapshot" as const;
export const REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM = "toSnapshot" as const;
export const REMEDIATION_FACTORY_RANKED_PAGE_PARAM = "rankedPage" as const;

export const REMEDIATION_FACTORY_RANKED_PATHS_DEFAULT_PAGE_SIZE = 25;

export function parseRemediationFactoryFindingIdFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length === 0 ? null : trimmed;
}

export function parseRemediationFactoryPathIdFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length === 0 ? null : trimmed;
}

export function parseRemediationFactorySnapshotIdFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length === 0 ? null : trimmed;
}

export function parseRemediationFactoryRankedPageFromSearch(raw: string | null | undefined): number {
  if (raw === null || raw === undefined) {
    return 1;
  }

  const trimmed = raw.trim();

  if (!/^\d+$/.test(trimmed)) {
    return 1;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export function remediationFactorySelectionHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly findingId?: string | null;
    readonly pathId?: string | null;
    readonly fromSnapshot?: string | null;
    readonly toSnapshot?: string | null;
    readonly rankedPage?: number;
  },
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  applyOperatorUrlSelectionSwitch(params, { kind: "disclosure-only" });
  const resolvedPath = navHrefPathPart(pathname);

  if (patch.findingId !== undefined) {
    if (patch.findingId === null) {
      params.delete(REMEDIATION_FACTORY_FINDING_ID_PARAM);
    } else {
      params.set(REMEDIATION_FACTORY_FINDING_ID_PARAM, patch.findingId);
    }
  }

  if (patch.pathId !== undefined) {
    if (patch.pathId === null) {
      params.delete(REMEDIATION_FACTORY_PATH_ID_PARAM);
    } else {
      params.set(REMEDIATION_FACTORY_PATH_ID_PARAM, patch.pathId);
    }
  }

  if (patch.fromSnapshot !== undefined) {
    if (patch.fromSnapshot === null) {
      params.delete(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM);
    } else {
      params.set(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM, patch.fromSnapshot);
    }
  }

  if (patch.toSnapshot !== undefined) {
    if (patch.toSnapshot === null) {
      params.delete(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM);
    } else {
      params.set(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM, patch.toSnapshot);
    }
  }

  if (patch.rankedPage !== undefined) {
    if (patch.rankedPage <= 1) {
      params.delete(REMEDIATION_FACTORY_RANKED_PAGE_PARAM);
    } else {
      params.set(REMEDIATION_FACTORY_RANKED_PAGE_PARAM, String(patch.rankedPage));
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? resolvedPath : `${resolvedPath}?${nextQuery}`;
}
