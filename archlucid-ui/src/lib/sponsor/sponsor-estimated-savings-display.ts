import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-report-markdown";
import { hasSponsorCommittedReviews } from "@/lib/sponsor/sponsor-dashboard-workspace-state";
import { formatUsd } from "@/lib/roi-assumptions";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

export type SponsorEstimatedSavingsPresentation = {
  readonly display: string;
  readonly footnote: string | null;
};

/** True when savings can be grounded in uploaded or demo cost evidence. */
export function workspaceHasCostEvidenceBasis(summary: SponsorRoiSummary | null | undefined): boolean {
  if (summary === null || summary === undefined) {
    return false;
  }

  const basis = (summary.savingsPricingBasis ?? "").trim().toLowerCase();

  if (basis.includes("demo") || basis.includes("illustrative")) {
    return true;
  }

  const status = (summary.costEvidenceFreshnessStatus ?? "").trim();

  if (status.length === 0) {
    return false;
  }

  if (/missing|not estimated|unavailable/i.test(status)) {
    return false;
  }

  return true;
}

/** Avoid prominent `$0` when the workspace cannot yet estimate portfolio savings. */
export function presentSponsorEstimatedSavings(
  usd: number | undefined,
  options: { readonly loading: boolean; readonly summary: SponsorRoiSummary | null | undefined },
): SponsorEstimatedSavingsPresentation {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;

  if (options.loading) {
    return { display: "…", footnote: null };
  }

  const hasReviews = hasSponsorCommittedReviews(options.summary);
  const hasCostEvidence = workspaceHasCostEvidenceBasis(options.summary);
  const amount = typeof usd === "number" && Number.isFinite(usd) ? usd : 0;

  if (!hasReviews || (!hasCostEvidence && amount === 0)) {
    return {
      display: v.estimatedSavingsNotAvailableYet,
      footnote: v.estimatedSavingsNotAvailableFootnote,
    };
  }

  return { display: formatUsd(amount), footnote: null };
}
