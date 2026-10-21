import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const MANIFEST_DELIVERABLES_ARTIFACTS_OPEN_PARAM = "manifestDeliverablesArtifactsOpen";

export function parseManifestDeliverablesArtifactsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function manifestDeliverablesArtifactsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, MANIFEST_DELIVERABLES_ARTIFACTS_OPEN_PARAM);
}
