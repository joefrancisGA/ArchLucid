import { isTransparencyTrailComplete } from "@/lib/feasibility/transparency-trail-completeness";
import { isManifestCommittedForPilotScorecardPackage } from "@/lib/pilot-scorecard-package-eligibility";
import type { ManifestSummary } from "@/types/authority";

/** ADR 0039 — committed seal without a complete transparency trail is a legacy re-export path. */
export function resolveLegacySealedReExportHonesty(
  manifestSummary: ManifestSummary | null | undefined,
): boolean {
  if (manifestSummary === null || manifestSummary === undefined) {
    return false;
  }

  if (!isManifestCommittedForPilotScorecardPackage(manifestSummary)) {
    return false;
  }

  const trail = manifestSummary.feasibilityVerdict?.transparencyTrail ?? null;

  return !isTransparencyTrailComplete(trail);
}
