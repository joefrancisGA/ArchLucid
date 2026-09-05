import type { ManifestSummary } from "@/types/authority";

import { isManifestCommittedForPilotScorecardPackage } from "@/lib/pilot-scorecard-package-eligibility";

/** Wave-28 suggestions 300–310: block run-collateral clipboard/export when manifest is not sealed-bound. */
export function runCollateralSealedManifestCopyBlockedReason(input: {
  runId: string;
  manifestVersion?: string | null;
}): string | null {
  const runId = input.runId.trim();

  if (runId.length === 0) {
    return "Export blocked: run id is missing.";
  }

  const manifestVersion = input.manifestVersion?.trim() ?? "";

  if (manifestVersion.length === 0) {
    return "Export blocked: run is not bound to a committed sealed manifest version.";
  }

  return null;
}

/** Resolve a sealed-manifest version token for copy/export guards from summary-only surfaces. */
export function manifestSummarySealedVersionForCopyGuard(summary: ManifestSummary | null): string | null {
  if (summary === null || !isManifestCommittedForPilotScorecardPackage(summary)) {
    return null;
  }

  return summary.manifestId;
}
