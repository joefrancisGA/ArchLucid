"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { useLlmMonthlyBudgetStatusQuery } from "@/hooks/use-llm-monthly-budget-status-query";
import { useDocumentHidden } from "@/lib/document-visibility";
import { isNextPublicDemoMode, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import {
  formatBuyerLlmUsageApproachingCopy,
  formatBuyerLlmUsageExhaustedCopy,
  llmBudgetRemainingPercent,
  shouldShowBuyerLlmUsageBandHint,
} from "@/lib/llm-monthly-budget-status";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { shouldPollBuyerLlmUsageBandHint } from "@/lib/shell-banner-poll-policy";

/**
 * Buyer-polished shell hint for UTC-month AI analysis budget headroom. Shows approximate percent remaining
 * (not dollar amounts) when utilization crosses the warn threshold; shows a persistent exhausted banner at hard cap.
 */
export function LlmUsageBandHint() {
  const documentHidden = useDocumentHidden();
  const queryEnabled =
    !isOperatorExperienceFullShellEnv() &&
    !isNextPublicDemoMode() &&
    !isStaticDemoPayloadFallbackEnabled();

  const { data: status } = useLlmMonthlyBudgetStatusQuery({
    enabled: queryEnabled,
    documentHidden,
    shouldPoll: shouldPollBuyerLlmUsageBandHint,
  });

  if (
    !queryEnabled ||
    status === undefined ||
    !shouldShowBuyerLlmUsageBandHint(status)
  ) {
    return null;
  }

  const remainingPercent = llmBudgetRemainingPercent(status);
  const exhausted = status.blocksAdditionalLlmExecution === true;

  if (exhausted) {
    return (
      <div
        className={cn(
          "rounded-md border border-rose-600/40 bg-al-surface-raised px-4 py-3 text-al-text-primary shadow-sm dark:border-rose-700/50",
          OPERATOR_TYPOGRAPHY.body,
        )}
        role="alert"
        data-testid="llm-usage-band-hint-exhausted"
      >
        <p className="m-0 font-semibold leading-snug">{formatBuyerLlmUsageExhaustedCopy()}</p>
        <p className={cn("m-0 mt-1 leading-snug", OPERATOR_TYPOGRAPHY.helper)}>
          <Link href="/pricing#pricing-quote-request" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            View pricing and request a quote
          </Link>
          {" · "}
          You can still open committed reviews and exports from earlier in this trial month.
        </p>
      </div>
    );
  }

  if (remainingPercent === null) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border border-amber-600/40 bg-al-surface-raised px-4 py-3 text-al-text-primary shadow-sm dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="status"
      data-testid="llm-usage-band-hint-approaching"
    >
      <p className="m-0 leading-snug">{formatBuyerLlmUsageApproachingCopy(remainingPercent)}</p>
      <p className={cn("m-0 mt-1 leading-snug", OPERATOR_TYPOGRAPHY.helper)}>
        <Link href="/pricing#pricing-quote-request" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
          Talk to us about upgrading
        </Link>
      </p>
    </div>
  );
}
