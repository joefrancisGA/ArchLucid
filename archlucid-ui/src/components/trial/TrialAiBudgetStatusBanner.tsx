"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useLlmMonthlyBudgetStatusQuery } from "@/hooks/use-llm-monthly-budget-status-query";
import { useWorkingCareerRehearsalDoor } from "@/hooks/use-working-career-rehearsal-door";
import { isNextPublicDemoMode, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { isSecureNowDemoChromeExcluded } from "@/lib/product-line/securenow-cloud-platform-policy";
import { formatTrialAiBudgetRemainingCopy } from "@/lib/llm-monthly-budget-status";
import { PUBLIC_DEMO_RECORD_MODE_CHROME_REMINDER } from "@/lib/governance/working-career-rehearsal-door-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

/** Public demo workspace banner — sample data with limited AI actions (ArchLucid evaluation shell only). */
export function PublicDemoAiUsageBanner() {
  const { productLine } = useProductLine();
  const { mode, mounted: workspaceMounted } = useWorkspaceMode();
  const { door, mounted: doorMounted } = useWorkingCareerRehearsalDoor();
  const demoMode = isNextPublicDemoMode();
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const { data: status } = useLlmMonthlyBudgetStatusQuery({
    enabled: concernFetchEnabled && !demoMode && isOperatorExperienceFullShellEnv(),
  });

  if (isSecureNowDemoChromeExcluded(productLine)) {
    return null;
  }

  const isPublicDemo = demoMode || status?.workspaceKind === "PublicDemo";

  if (!isPublicDemo) {
    return null;
  }

  const showRecordModeReminder =
    workspaceMounted && doorMounted && isWorkingWorkspaceMode(mode) && door === "career";

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
      {showRecordModeReminder ? (
        <p
          className={cn("m-0 mt-2 text-sky-900 dark:text-sky-100", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="public-demo-record-mode-reminder"
        >
          {PUBLIC_DEMO_RECORD_MODE_CHROME_REMINDER}
        </p>
      ) : null}
    </div>
  );
}

/** Trial workspace AI budget remaining and exhaustion messaging. */
export function TrialAiBudgetStatusBanner() {
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const queryEnabled = concernFetchEnabled && isOperatorExperienceFullShellEnv() && !isNextPublicDemoMode();
  const { data: status } = useLlmMonthlyBudgetStatusQuery({
    enabled: queryEnabled,
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
