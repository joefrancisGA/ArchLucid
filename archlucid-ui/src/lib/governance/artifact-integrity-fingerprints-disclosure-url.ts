export const ARTIFACT_INTEGRITY_FINGERPRINTS_OPEN_PARAM = "artifactIntegrityFingerprintsOpen";

export function parseArtifactIntegrityFingerprintsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function artifactIntegrityFingerprintsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ARTIFACT_INTEGRITY_FINGERPRINTS_OPEN_PARAM);
  } else {
    params.set(ARTIFACT_INTEGRITY_FINGERPRINTS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
