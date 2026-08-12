import {
  shouldShowBuyerLlmUsageBandHint,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";

export const SHELL_BANNER_POLL_MS = 60_000;

/**
 * Shell banner poll matrix (TB-2029):
 * - Trial AI budget → poll only while the remaining-budget banner is visible
 * - LLM approaching limit → poll only while warn/critical banner is visible
 * - Service Bus health → poll only while degraded banner is shown
 * - Hidden tab → all shell banner polls paused
 */
export function shouldPollTrialAiBudgetBanner(
  status: LlmMonthlyDollarBudgetStatus | undefined,
): boolean {
  if (!status?.monthlyBudgetMonitoringActive || status.workspaceKind !== "Trial") {
    return false;
  }

  return status.customerAiProviderConfigured !== true;
}

export function shouldPollLlmBudgetApproachingBanner(
  status: LlmMonthlyDollarBudgetStatus | undefined,
): boolean {
  return status?.monthlyBudgetMonitoringActive === true;
}

/** Buyer-polished shell band hint — poll only while approaching/exhausted copy is visible. */
export function shouldPollBuyerLlmUsageBandHint(
  status: LlmMonthlyDollarBudgetStatus | undefined,
): boolean {
  return status !== undefined && shouldShowBuyerLlmUsageBandHint(status);
}

export function resolveShellBannerPollIntervalMs(args: {
  readonly enabled: boolean;
  readonly documentHidden: boolean;
  readonly shouldPoll: boolean;
  readonly intervalMs?: number;
}): number | false {
  if (!args.enabled || args.documentHidden || !args.shouldPoll) {
    return false;
  }

  return args.intervalMs ?? SHELL_BANNER_POLL_MS;
}
