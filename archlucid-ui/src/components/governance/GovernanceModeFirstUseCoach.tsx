"use client";

import { useCallback, useEffect, useState, type JSX } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildGovernanceModeTeaching,
  dismissGovernanceModeTeaching,
  isGovernanceModeTeachingDismissed,
  type GovernanceModeTeachingModel,
} from "@/lib/governance-mode-teaching";
import { cn } from "@/lib/utils";

export type GovernanceModeFirstUseCoachProps = {
  readonly enabled: boolean;
  readonly className?: string;
  readonly model?: GovernanceModeTeachingModel;
};

/** TB-2392 — First-enable coach when governance view is turned on. */
export function GovernanceModeFirstUseCoach(props: GovernanceModeFirstUseCoachProps): JSX.Element | null {
  const model = props.model ?? buildGovernanceModeTeaching();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setDismissed(isGovernanceModeTeachingDismissed());
    setReady(true);
  }, []);

  const onDismiss = useCallback(() => {
    dismissGovernanceModeTeaching();
    setDismissed(true);
  }, []);

  if (!props.enabled || !ready || dismissed) {
    return null;
  }

  return (
    <aside
      className={cn(
        "space-y-2 rounded-md border border-teal-700/25 bg-teal-50/40 px-3 py-2 dark:border-teal-600/30 dark:bg-teal-950/20",
        props.className,
      )}
      aria-labelledby="governance-mode-first-use-coach-heading"
      data-testid="governance-mode-first-use-coach"
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          id="governance-mode-first-use-coach-heading"
          className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}
        >
          {model.heading}
        </h3>
        <DismissControl
          className="shrink-0"
          label={model.dismissLabel}
          data-testid="governance-mode-first-use-coach-dismiss"
          onDismiss={onDismiss}
        />
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{model.lead}</p>
      <ol className={cn("m-0 list-decimal space-y-1 pl-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.steps.map((step) => (
          <li key={step.id} data-testid={`governance-mode-first-use-coach-step-${step.id}`}>
            <span className="font-medium">{step.label}</span>
            {": "}
            {step.body}
          </li>
        ))}
      </ol>
    </aside>
  );
}
