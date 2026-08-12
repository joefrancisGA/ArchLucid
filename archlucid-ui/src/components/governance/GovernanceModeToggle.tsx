"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { GOVERNANCE_MODE_COPY } from "@/lib/vocabulary/governance-mode-vocabulary";
import { useGovernanceMode } from "@/hooks/use-governance-mode";

type GovernanceModeToggleProps = {
  readonly className?: string;
  readonly showFootnote?: boolean;
  readonly testId?: string;
};

/** Sidebar / shell toggle — pilot labels by default; enterprise governance on demand. */
export function GovernanceModeToggle(props: GovernanceModeToggleProps) {
  const { className, showFootnote = true, testId = "governance-mode-toggle" } = props;
  const { mounted, isGovernanceModeEnabled, setGovernanceModeEnabled } = useGovernanceMode();

  if (!mounted) {
    return <div aria-hidden className="h-9" data-testid={`${testId}-placeholder`} />;
  }

  const inputId = `${testId}-input`;

  return (
    <div className={cn("space-y-2", className)} data-testid={`${testId}-wrap`}>
      <label
        htmlFor={inputId}
        className={cn("flex cursor-pointer items-start gap-2 rounded-md border border-neutral-200 px-3 py-2 text-neutral-800 dark:border-neutral-700 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}
      >
        <input
          id={inputId}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
          data-testid={testId}
          checked={isGovernanceModeEnabled}
          aria-label={
            isGovernanceModeEnabled
              ? `${GOVERNANCE_MODE_COPY.toggleLabel} — on. ${GOVERNANCE_MODE_COPY.toggleAssistiveOn}`
              : `${GOVERNANCE_MODE_COPY.toggleLabel} — off. ${GOVERNANCE_MODE_COPY.toggleAssistiveOff}`
          }
          onChange={(event) => {
            setGovernanceModeEnabled(event.target.checked);
          }}
        />
        <span className="min-w-0 leading-snug">
          <span className="block font-medium">{GOVERNANCE_MODE_COPY.toggleLabel}</span>
          <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {GOVERNANCE_MODE_COPY.toggleTitle}
          </span>
        </span>
      </label>
      {showFootnote && !isGovernanceModeEnabled ? (
        <p className={cn("m-0 px-1 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {GOVERNANCE_MODE_COPY.toggleFootnote}
        </p>
      ) : null}
    </div>
  );
}
