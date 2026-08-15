"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useLlmMonthlyBudgetStatusQuery } from "@/hooks/use-llm-monthly-budget-status-query";
import { useDocumentHidden } from "@/lib/document-visibility";
import { isNextPublicDemoMode, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { formatTrialAiBudgetRemainingCopy } from "@/lib/llm-monthly-budget-status";
import {
  shouldPollTrialAiBudgetBanner,
} from "@/lib/shell-banner-poll-policy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";

/** Demo workspace banner — sample data with limited AI actions. */
export function PublicDemoAiUsageBanner() {
  const demoMode = isNextPublicDemoMode();
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const { data: status } = useLlmMonthlyBudgetStatusQuery({
    enabled: concernFetchEnabled && !demoMode && isOperatorExperienceFullShellEnv(),
    refetchIntervalMs: false,
  });
  const isPublicDemo = demoMode || status?.workspaceKind === "PublicDemo";

  if (!isPublicDemo) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-4 rounded-md border border-sky-700/40 bg-al-surface-raised px-4 py-3 text-al-text-primary shadow-sm dark:border-sky-600/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="status"
      data-testid="public-demo-ai-usage-banner"
    >
      <p className="m-0 font-semibold text-sky-950 dark:text-sky-100">
        Demo workspace — sample data only. Some AI actions are limited.
      </p>
    </div>
  );
}

/** Trial workspace AI budget remaining and exhaustion messaging. */
export function TrialAiBudgetStatusBanner() {
  const documentHidden = useDocumentHidden();
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const queryEnabled = concernFetchEnabled && isOperatorExperienceFullShellEnv() && !isNextPublicDemoMode();
  const { data: status } = useLlmMonthlyBudgetStatusQuery({
    enabled: queryEnabled,
    documentHidden,
    shouldPoll: shouldPollTrialAiBudgetBanner,
  });

  if (!status?.monthlyBudgetMonitoringActive || status.workspaceKind !== "Trial") {
    return null;
  }

  if (status.customerAiProviderConfigured === true) {
    return (
      <div
        className={cn(
          "mb-4 rounded-md border border-neutral-300 bg-al-surface-raised px-4 py-3 dark:border-neutral-600",
          OPERATOR_TYPOGRAPHY.body,
        )}
        role="status"
        data-testid="trial-customer-ai-provider-banner"
      >
        <p className="m-0 text-al-text-primary">
          Use your organization&apos;s AI provider for this workspace.
        </p>
      </div>
    );
  }

  if (status.blocksAdditionalLlmExecution) {
    return (
      <div
        className={cn(
          "mb-4 rounded-md border border-rose-600/40 bg-al-surface-raised px-4 py-3 text-al-text-primary shadow-sm dark:border-rose-700/50",
          OPERATOR_TYPOGRAPHY.body,
        )}
        role="alert"
        data-testid="trial-ai-budget-exhausted-banner"
      >
        <p className="m-0 font-semibold text-rose-900 dark:text-rose-100">
          Trial AI budget exhausted. Request more credits or connect an approved AI provider.
        </p>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Link href={AI_USAGE_SETTINGS_PATH} className={OPERATOR_LINK.nav}>
            Request more trial credits
          </Link>
        </p>
      </div>
    );
  }

  const remaining = status.remainingBudgetUsd;

  if (remaining === null || remaining === undefined) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-4 rounded-md border border-neutral-300 bg-al-surface-raised px-4 py-3 dark:border-neutral-600",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="status"
      data-testid="trial-ai-budget-remaining-banner"
    >
      <p className="m-0 text-al-text-primary">{formatTrialAiBudgetRemainingCopy(remaining)}</p>
    </div>
  );
}

/** Short warning before expensive trial AI actions (import where confirmations are shown). */
export function trialAiCreditWarningCopy(): string {
  return "This action may use trial AI credits.";
}
