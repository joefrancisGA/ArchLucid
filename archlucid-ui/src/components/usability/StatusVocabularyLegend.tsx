"use client";

import { FIRST_PILOT_OPERATOR_STATUS_VOCABULARY } from "@/lib/first-pilot-operator-status-vocabulary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Inline legend for READY / NEEDS ATTENTION / BLOCKED / DEFERRED / NEXT ACTION labels on Home. */
export function StatusVocabularyLegend() {
  const rows = [
    { label: "READY", description: FIRST_PILOT_OPERATOR_STATUS_VOCABULARY.ready },
    { label: "NEEDS ATTENTION", description: FIRST_PILOT_OPERATOR_STATUS_VOCABULARY.needsAttention },
    { label: "BLOCKED", description: FIRST_PILOT_OPERATOR_STATUS_VOCABULARY.blocked },
    { label: "DEFERRED", description: FIRST_PILOT_OPERATOR_STATUS_VOCABULARY.deferred },
    { label: "NEXT ACTION", description: FIRST_PILOT_OPERATOR_STATUS_VOCABULARY.nextAction },
  ];

  return (
    <details
      className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="status-vocabulary-legend"
    >
      <summary className={cn("cursor-pointer select-none", OPERATOR_TYPOGRAPHY.meta, "text-neutral-700 dark:text-neutral-300")}>
        Status labels — what they mean
      </summary>
      <ul className="m-0 mt-2 list-none space-y-1.5 p-0">
        {rows.map((row) => (
          <li key={row.label} className="text-sm text-neutral-700 dark:text-neutral-300">
            <span className="font-semibold">{row.label}</span>
            <span className="text-neutral-600 dark:text-neutral-400"> — {row.description}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
