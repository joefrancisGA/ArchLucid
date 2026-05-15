/** Normalized extractor artifact filenames (Azure package per V1_SCOPE §2.16). */
export const RUN_POTENTIAL_SAVINGS_COST_ACTUAL_ARTIFACT_FILENAMES: readonly string[] = ["cost-actual.json"];

export const RUN_POTENTIAL_SAVINGS_ORPHAN_CANDIDATES_ARTIFACT_FILENAMES: readonly string[] = [
  "orphan-candidates.json",
];

/** Last path segment — strips accidental query fragments (defensive only). */
export function normalizeArtifactFileNameSegment(name: string): string {
  let trimmed: string = name.trim();
  const cutQuery = trimmed.indexOf("?");

  if (cutQuery >= 0) trimmed = trimmed.slice(0, cutQuery);

  const cutHash = trimmed.indexOf("#");

  if (cutHash >= 0) trimmed = trimmed.slice(0, cutHash);

  trimmed = trimmed.replace(/\\/g, "/");
  const slash = trimmed.lastIndexOf("/");

  return slash >= 0 ? trimmed.slice(slash + 1) : trimmed;
}

/**
 * Matches `cost-actual.json`-style extractor entries (basename or nested suffix;
 * same-line condition per team single-line-if preference where readable).
 */
export function artifactBasenameMatchesList(name: string, haystack: readonly string[]): boolean {
  const normalized = normalizeArtifactFileNameSegment(name).toLowerCase();
  const fullLower = name.trim().toLowerCase();

  return haystack.some((h) => {
    const hc = h.toLowerCase();

    return normalized === hc || fullLower.endsWith(`/${hc}`);
  });
}
