import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const WORKSPACE_AI_PROBE_DEBUG_METADATA_OPEN_PARAM = "workspaceAiProbeDebugMetadataOpen";

export function parseWorkspaceAiProbeDebugMetadataOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function workspaceAiProbeDebugMetadataDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, WORKSPACE_AI_PROBE_DEBUG_METADATA_OPEN_PARAM);
}
