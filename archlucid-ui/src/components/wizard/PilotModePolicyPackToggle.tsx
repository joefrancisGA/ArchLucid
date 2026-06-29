"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { FOCUSED_PILOT_MODE_COPY } from "@/lib/focused-pilot-mode-policy-packs";

type PilotModePolicyPackToggleProps = {
  readonly enabled: boolean;
  readonly onEnabledChange: (enabled: boolean) => void;
  readonly className?: string;
  readonly testId?: string;
};

/** Limits review policy evaluation to security baseline + cost packs for first-pilot time-to-value. */
export function PilotModePolicyPackToggle(props: PilotModePolicyPackToggleProps) {
  const { enabled, onEnabledChange, className, testId = "pilot-mode-policy-pack-toggle" } = props;
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
          checked={enabled}
          aria-label={
            enabled
              ? `${FOCUSED_PILOT_MODE_COPY.toggleLabel} — on. ${FOCUSED_PILOT_MODE_COPY.toggleAssistiveOn}`
              : `${FOCUSED_PILOT_MODE_COPY.toggleLabel} — off. ${FOCUSED_PILOT_MODE_COPY.toggleAssistiveOff}`
          }
          onChange={(event) => {
            onEnabledChange(event.target.checked);
          }}
        />
        <span className="min-w-0 leading-snug">
          <span className="block font-medium">{FOCUSED_PILOT_MODE_COPY.toggleLabel}</span>
          <span className={cn("mt-1 block font-normal text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {FOCUSED_PILOT_MODE_COPY.toggleDescription}
          </span>
        </span>
      </label>
    </div>
  );
}
