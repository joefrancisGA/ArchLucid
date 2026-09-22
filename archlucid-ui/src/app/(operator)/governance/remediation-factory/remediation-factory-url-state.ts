import { navHrefPathPart } from "@/lib/nav-href-path-part";

export const REMEDIATION_FACTORY_FINDING_ID_PARAM = "findingId" as const;
export const REMEDIATION_FACTORY_PATH_ID_PARAM = "pathId" as const;
export const REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM = "fromSnapshot" as const;
export const REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM = "toSnapshot" as const;

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

export function remediationFactorySelectionHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly findingId?: string | null;
    readonly pathId?: string | null;
    readonly fromSnapshot?: string | null;
    readonly toSnapshot?: string | null;
  },
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
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

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? resolvedPath : `${resolvedPath}?${nextQuery}`;
}
