import { navHrefPathPart } from "@/lib/nav-href-path-part";

export const REMEDIATION_PATTERN_ID_PARAM = "patternId" as const;
export const REMEDIATION_PATTERN_VERSION_PARAM = "version" as const;

export const REMEDIATION_PATTERN_YAML_IMPORT_SECTION_ID = "remediation-pattern-yaml-import" as const;

export function parseRemediationPatternIdFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length === 0 ? null : trimmed;
}

export function parseRemediationPatternVersionFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length === 0 ? null : trimmed;
}

export function remediationPatternSelectionHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly patternId: string | null;
    readonly version: string | null;
  },
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const resolvedPath = navHrefPathPart(pathname);

  if (patch.patternId === null) {
    params.delete(REMEDIATION_PATTERN_ID_PARAM);
    params.delete(REMEDIATION_PATTERN_VERSION_PARAM);
  } else {
    params.set(REMEDIATION_PATTERN_ID_PARAM, patch.patternId);

    if (patch.version === null) {
      params.delete(REMEDIATION_PATTERN_VERSION_PARAM);
    } else {
      params.set(REMEDIATION_PATTERN_VERSION_PARAM, patch.version);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? resolvedPath : `${resolvedPath}?${nextQuery}`;
}

export function remediationPatternYamlImportHref(pathname: string): string {
  const resolvedPath = navHrefPathPart(pathname);

  return `${resolvedPath}#${REMEDIATION_PATTERN_YAML_IMPORT_SECTION_ID}`;
}
