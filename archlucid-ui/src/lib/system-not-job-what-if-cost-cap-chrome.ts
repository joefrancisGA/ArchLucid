import { formatDraftBranchQuotaSummary } from "@/lib/draft-branch-quota-display";
import type { DraftBranchQuotaResponse } from "@/types/draft-intake";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_DOC_ANCHOR =
  "docs/architecture/adrs/0092-working-cheap-what-if-envelope.md" as const;

export const SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_HEADING = "What-if branch cap (R12)" as const;

/** CG-095 / SN-009 — branch quota is not the shell AI budget pill and not the Career/Rehearsal door. */
export const SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL =
  "This cap counts billable what-if branches per parent draft — not the shell AI budget pill and not the Career or Rehearsal door." as const;

export const SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_OVER_CAP_BLOCKED =
  "Branch cap reached for this parent draft — you cannot start another full-pipeline what-if from this snapshot. Submit an existing branch or start a new intake." as const;

export const SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_CONFIRM_DOM_TEST_ID =
  "architecture-what-if-cost-cap-chrome" as const;

export type DraftBranchWhatIfCostCapChrome = {
  readonly allowsFullPipelineWhatIf: boolean;
  readonly capSummary: string | null;
  readonly overCapBlockedReason: string | null;
  readonly confirmDisabled: boolean;
  readonly notBudgetPillHonesty: string;
};

export function isDraftBranchWhatIfOverCap(quota: DraftBranchQuotaResponse): boolean {
  return quota.canBranch === false || quota.remainingBranches <= 0;
}

/**
 * SN-009 — R12 branch cap chrome for full-pipeline what-if honesty (TB-2005 disable when over cap).
 * Uses branch-quota API only — never the shell LLM budget pill.
 */
export function resolveDraftBranchWhatIfCostCapChrome(args: {
  readonly quota: DraftBranchQuotaResponse | null | undefined;
  readonly quotaLoading: boolean;
  readonly quotaFailed: boolean;
}): DraftBranchWhatIfCostCapChrome {
  const notBudgetPillHonesty = SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL;

  if (args.quotaLoading) {
    return {
      allowsFullPipelineWhatIf: false,
      capSummary: null,
      overCapBlockedReason: null,
      confirmDisabled: true,
      notBudgetPillHonesty,
    };
  }

  if (args.quotaFailed || args.quota === null || args.quota === undefined) {
    return {
      allowsFullPipelineWhatIf: true,
      capSummary: null,
      overCapBlockedReason: null,
      confirmDisabled: false,
      notBudgetPillHonesty,
    };
  }

  const allowsFullPipelineWhatIf = !isDraftBranchWhatIfOverCap(args.quota);
  const capSummary = formatDraftBranchQuotaSummary(args.quota);
  const overCapBlockedReason = allowsFullPipelineWhatIf
    ? null
    : SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_OVER_CAP_BLOCKED;

  return {
    allowsFullPipelineWhatIf,
    capSummary,
    overCapBlockedReason,
    confirmDisabled: !allowsFullPipelineWhatIf,
    notBudgetPillHonesty,
  };
}
