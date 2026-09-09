import type { ErrorRecoveryContractPresentation } from "@/lib/error-recovery-contract-copy";

import type { RunExportLineageVerificationResult } from "@/lib/exports/run-export-lineage-verify";

/** TB-2155 recovery when Working export verify blocks download (DR-10 / TB-2155). */
export function exportVerifyBlockedRecovery(
  result: RunExportLineageVerificationResult,
): ErrorRecoveryContractPresentation {
  const statusPhrase =
    result.status === "NotAttested"
      ? "not attested (no commit anchor or sealed hash)"
      : "hash mismatch";

  const detailSuffix =
    result.detail !== null && result.detail !== undefined && result.detail.trim().length > 0
      ? ` ${result.detail.trim()}`
      : "";

  return {
    whatFailed: `Export lineage verify returned ${statusPhrase} for this review.${detailSuffix}`,
    whatIsIntact:
      "The sealed review record on the server is unchanged; no export file was downloaded by this attempt.",
    nextStep:
      "Confirm the review is finalized, retry verify from the export menu, or use a narrower export (findings CSV or decision receipt) from Artifacts.",
  };
}

/** TB-2155 recovery when traceability bundle exceeds API size cap (DR-10). */
export function traceabilityBundleTooLargeRecovery(): ErrorRecoveryContractPresentation {
  return {
    whatFailed: "The evidence bundle exceeded the size cap for a single ZIP download.",
    whatIsIntact: "Findings, manifest summary, and decision receipt exports remain available for this review.",
    nextStep:
      "Use findings-only CSV or the decision receipt stamp export from Artifacts instead of the full evidence bundle.",
  };
}
