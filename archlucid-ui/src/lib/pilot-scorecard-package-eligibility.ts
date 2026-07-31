import type { ManifestSummary } from "@/types/authority";

/**
 * Pilot ROI / scorecard package CTA is shown only when the run has a golden manifest **and** we have loaded a manifest
 * summary that is not a pre-finalize draft. `ManifestDocument.Metadata.Status` after commit is an evaluation outcome
 * (`Resolved` / `NeedsAttention`), not the run lifecycle label `Committed` — both must count as a finalized package.
 * Buyer/summary projections may also surface `Finalized`. Avoids advertising sponsor exports while the summary is
 * still a draft or while summary fetch failed.
 */
export function isManifestCommittedForPilotScorecardPackage(manifestSummary: ManifestSummary | null): boolean {
  if (manifestSummary === null) return false;

  const status = (manifestSummary.status ?? "").trim();

  if (status.length === 0) {
    return false;
  }

  // Pre-finalize evaluation labels — keep CTA hidden until the package is committed.
  if (/^draft$/i.test(status) || /^in[\s_-]*review$/i.test(status) || /^pending$/i.test(status)) {
    return false;
  }

  return (
    /^committed$/i.test(status)
    || /^finalized$/i.test(status)
    || /^approved$/i.test(status)
    || /^resolved$/i.test(status)
    || /^needs[\s_-]*attention$/i.test(status)
  );
}
