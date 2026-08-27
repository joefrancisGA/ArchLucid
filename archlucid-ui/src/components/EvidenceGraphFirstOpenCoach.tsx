"use client";

import { useCallback, useEffect, useState, type JSX } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildEvidenceGraphFirstOpenCoach,
  dismissEvidenceGraphFirstOpenCoach,
  isEvidenceGraphFirstOpenCoachDismissed,
  type EvidenceGraphFirstOpenCoachModel,
} from "@/lib/evidence-graph-first-open-coach";
import { cn } from "@/lib/utils";

export type EvidenceGraphFirstOpenCoachProps = {
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildEvidenceGraphFirstOpenCoach}. */
  readonly model?: EvidenceGraphFirstOpenCoachModel;
};

/**
 * TB-2244 — First-open coach on the evidence graph page.
 * Dismissible via localStorage; prefer this over forcing ExplainThisView for this route.
 */
export function EvidenceGraphFirstOpenCoach(
  props: EvidenceGraphFirstOpenCoachProps,
): JSX.Element | null {
  const model = props.model ?? buildEvidenceGraphFirstOpenCoach();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setDismissed(isEvidenceGraphFirstOpenCoachDismissed());
    setReady(true);
  }, []);

  const onDismiss = useCallback(() => {
    dismissEvidenceGraphFirstOpenCoach();
    setDismissed(true);
  }, []);

  if (!ready || dismissed) {
    return null;
  }

  return (
    <aside
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
        props.className,
      )}
      aria-labelledby="evidence-graph-first-open-coach-heading"
      data-testid="evidence-graph-first-open-coach"
    >
      <div className="flex items-start justify-between gap-2">
        <h2
          id="evidence-graph-first-open-coach-heading"
          className={cn(
            "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          {model.heading}
        </h2>
        <DismissControl
          className="shrink-0"
          label={model.dismissLabel}
          data-testid="evidence-graph-first-open-coach-dismiss"
          onDismiss={onDismiss}
        />
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{model.lead}</p>
      <ul
        className={cn(
          "m-0 list-none space-y-1 p-0 text-al-text-primary",
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        {model.sections.map((section) => (
          <li
            key={section.id}
            data-testid={`evidence-graph-first-open-coach-section-${section.id}`}
          >
            <span className="font-medium">{section.label}</span>
            {": "}
            {section.body}
          </li>
        ))}
      </ul>
    </aside>
  );
}
