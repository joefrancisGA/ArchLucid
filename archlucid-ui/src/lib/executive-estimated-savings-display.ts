import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { hasExecutiveCommittedReviews } from "@/lib/executive-dashboard-workspace-state";
import { formatUsd } from "@/lib/roi-assumptions";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

export type ExecutiveEstimatedSavingsPresentation = {
  readonly display: string;
  readonly footnote: string | null;
};

/** True when savings can be grounded in uploaded or demo cost evidence. */
export function workspaceHasCostEvidenceBasis(summary: ExecutiveRoiSummary | null | undefined): boolean {
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
export function presentExecutiveEstimatedSavings(
  usd: number | undefined,
  options: { readonly loading: boolean; readonly summary: ExecutiveRoiSummary | null | undefined },
): ExecutiveEstimatedSavingsPresentation {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  if (options.loading) {
    return { display: "…", footnote: null };
  }

  const hasReviews = hasExecutiveCommittedReviews(options.summary);
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
