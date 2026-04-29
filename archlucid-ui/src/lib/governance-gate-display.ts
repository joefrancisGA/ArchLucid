/**
 * Maps persisted manifest status to a reviewer-facing governance gate label.
 * API may emit `Committed` for a finalized record; UI elsewhere maps that to "Finalized".
 */
export function governanceGateLabelFromManifestStatus(status: string | undefined | null): string {
  const t = (status ?? "").trim();

  if (t.length === 0) {
    return "Not configured";
  }

  if (/^committed$/i.test(t) || /^finalized$/i.test(t) || /^approved$/i.test(t)) {
    return "Passed";
  }

  if (/^fail/i.test(t) || /^reject/i.test(t) || /^blocked$/i.test(t)) {
    return "Failed";
  }

  if (/^not[\s_-]*required$/i.test(t) || /^skipped$/i.test(t)) {
    return "Not required";
  }

  return "Pending";
}
