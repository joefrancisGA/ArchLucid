"use client";

import type { ReactElement } from "react";

import {
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_CONFIRM_DOM_TEST_ID,
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_HEADING,
  type DraftBranchWhatIfCostCapChrome,
} from "@/lib/system-not-job-what-if-cost-cap-chrome";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureWhatIfCostCapChromeProps = {
  readonly chrome: DraftBranchWhatIfCostCapChrome;
  readonly quotaLoading: boolean;
};

/** SN-009 — visible R12 branch cap honesty inside clone/what-if confirm surfaces. */
export function ArchitectureWhatIfCostCapChrome(
  props: ArchitectureWhatIfCostCapChromeProps,
): ReactElement {
  const chrome = props.chrome;

  return (
    <div
      className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900"
      data-testid={SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_CONFIRM_DOM_TEST_ID}
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_HEADING}
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-what-if-cost-cap-not-budget-pill">
        {chrome.notBudgetPillHonesty}
      </p>
      {props.quotaLoading ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-what-if-cost-cap-loading">
          Loading branch cap…
        </p>
      ) : null}
      {chrome.capSummary !== null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-what-if-cost-cap-summary">
          {chrome.capSummary}
        </p>
      ) : null}
      {chrome.overCapBlockedReason !== null ? (
        <p
          className={cn("m-0 font-medium text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="architecture-what-if-cost-cap-over-cap"
        >
          {chrome.overCapBlockedReason}
        </p>
      ) : null}
    </div>
  );
}
