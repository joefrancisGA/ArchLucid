"use client";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { LivelihoodMutationResumePresentation } from "@/lib/auth/livelihood-mutation-resume-copy";
import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";

export type LivelihoodMutationResumeChromeProps = {
  readonly presentation: LivelihoodMutationResumePresentation;
  readonly replayErrorMessage?: string | null;
  readonly onConfirm: () => void;
  readonly onDiscard: () => void;
  readonly isReplaying?: boolean;
};

/** Working copy for livelihood 401 resume — honest about requestLeftClient (LW-065). */
export function LivelihoodMutationResumeChrome(
  props: LivelihoodMutationResumeChromeProps,
): React.JSX.Element | null {
  const { presentation, onConfirm, onDiscard, isReplaying = false, replayErrorMessage = null } = props;

  if (!presentation.requiresConfirm) {
    return (
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[60] max-w-md rounded-md border border-neutral-200 bg-white px-4 py-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
        data-testid="livelihood-mutation-resume-status"
        role="status"
      >
        <p className={`m-0 font-semibold text-neutral-900 dark:text-neutral-50 ${OPERATOR_TYPOGRAPHY.helper}`}>
          {presentation.headline}
        </p>
        <p className={`m-0 mt-1 text-neutral-700 dark:text-neutral-200 ${OPERATOR_TYPOGRAPHY.helper}`}>
          {presentation.detail}
        </p>
        {replayErrorMessage !== null ? (
          <>
            <OperatorMutationInlineError
              className="mt-3"
              message={replayErrorMessage}
              recoveryPresentation={errorRecoveryContractForScenario("livelihood-mutation-resume-failed", {
                failureSummary: replayErrorMessage,
              })}
              testId="livelihood-mutation-resume-failure"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                data-testid="livelihood-mutation-resume-confirm-button"
                disabled={isReplaying}
                onClick={onConfirm}
                type="button"
                variant="default"
              >
                {presentation.confirmLabel}
              </Button>
              <Button
                data-testid="livelihood-mutation-resume-discard-button"
                disabled={isReplaying}
                onClick={onDiscard}
                type="button"
                variant="outline"
              >
                {presentation.discardLabel}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div
      aria-labelledby="livelihood-mutation-resume-heading"
      className="fixed bottom-4 right-4 z-[60] max-w-md space-y-3 rounded-md border border-neutral-200 bg-white px-4 py-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="livelihood-mutation-resume-confirm"
      role="dialog"
    >
      <div className="space-y-1">
        <h2
          className={`m-0 font-semibold text-neutral-900 dark:text-neutral-50 ${OPERATOR_TYPOGRAPHY.helper}`}
          id="livelihood-mutation-resume-heading"
        >
          {presentation.headline}
        </h2>
        <p className={`m-0 text-neutral-700 dark:text-neutral-200 ${OPERATOR_TYPOGRAPHY.helper}`}>
          {presentation.detail}
        </p>
      </div>
      {replayErrorMessage !== null ? (
        <OperatorMutationInlineError
          message={replayErrorMessage}
          recoveryPresentation={errorRecoveryContractForScenario("livelihood-mutation-resume-failed", {
            failureSummary: replayErrorMessage,
          })}
          testId="livelihood-mutation-resume-failure"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          data-testid="livelihood-mutation-resume-confirm-button"
          disabled={isReplaying}
          onClick={onConfirm}
          type="button"
          variant="default"
        >
          {presentation.confirmLabel}
        </Button>
        <Button
          data-testid="livelihood-mutation-resume-discard-button"
          disabled={isReplaying}
          onClick={onDiscard}
          type="button"
          variant="outline"
        >
          {presentation.discardLabel}
        </Button>
      </div>
    </div>
  );
}
