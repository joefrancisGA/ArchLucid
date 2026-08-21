import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-report-markdown";
import { formatUsd } from "@/lib/roi-assumptions";

export type SponsorRoiIdentifiedVsRealizedBuckets = {
  /** Open + needs-evidence USD — headline scope; not yet remediated. */
  identifiedPendingApprovalUsd: number;
  /** Remediated disposition USD — committed governance outcome. */
  realizedCommittedUsd: number;
  /** Whether server returned a disposition-aware basis breakdown. */
  hasBasisBreakdown: boolean;
  deferredWaivedAcceptedUsd: number;
};

export const SPONSOR_ROI_IDENTIFIED_PENDING_LABEL = "Identified savings (pending approval)";
export const SPONSOR_ROI_IDENTIFIED_PENDING_DESCRIPTION =
  "Open findings and those awaiting evidence — estimated USD not yet realized through remediation.";
export const SPONSOR_ROI_REALIZED_COMMITTED_LABEL = "Realized savings (committed & applied)";
export const SPONSOR_ROI_REALIZED_COMMITTED_DESCRIPTION =
  "Findings marked remediated in the approval workflow — defensible realized value, not headline potential.";

/** Maps sponsor-report API fields to sponsor-facing identified vs realized buckets. */
export function resolveSponsorRoiIdentifiedVsRealized(
  summary: SponsorRoiSummary,
): SponsorRoiIdentifiedVsRealizedBuckets {
  const basis = summary.basisBreakdown;

  if (basis === undefined || basis === null) {
    return {
      identifiedPendingApprovalUsd: summary.totalEstimatedUsdSavings,
      realizedCommittedUsd: 0,
      hasBasisBreakdown: false,
      deferredWaivedAcceptedUsd: 0,
    };
  }

  const identifiedPendingApprovalUsd = basis.openEstimatedUsd + basis.needsEvidenceUsd;
  const deferredWaivedAcceptedUsd =
    basis.deferredUsd + basis.waivedUsd + basis.acceptedRiskUsd + basis.rejectedNotApplicableUsd;

  return {
    identifiedPendingApprovalUsd,
    realizedCommittedUsd: basis.realizedUsd,
    hasBasisBreakdown: true,
    deferredWaivedAcceptedUsd,
  };
}

export function formatSponsorRoiUsd(value: number): string {
  return formatUsd(value);
}
