import Link from "next/link";

import { OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS } from "@/lib/operator-first-hour-journey-nav";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Compact four-step first-hour path for standard operator Home — Pilot first, Operate later.
 */
export function OperatorFirstHourJourneyStrip() {
  const steps = OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS;

  return (
    <section
      role="region"
      id="operator-first-hour-path"
      aria-label="First-hour operator path"
      className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800"
      data-testid="operator-first-hour-journey-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.section, "text-teal-900 dark:text-teal-200")}>
        First-hour path
      </p>
      <p className={cn("m-0 mt-2 max-w-prose", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
        Pilot first, Operate later — complete one review package before opening analysis or governance depth.
      </p>
      <ol className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-2 p-0", OPERATOR_TYPE_SCALE.body)}>
        {steps.map((item) => (
          <li key={item.step} className="min-w-0">
            <Link
              href={item.href}
              title={item.chipTooltip}
              className="font-medium text-teal-900 underline decoration-teal-300 underline-offset-2 hover:text-teal-950 dark:text-teal-100 dark:decoration-teal-700 dark:hover:text-teal-50"
            >
              <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{item.step}.</span> {item.label}
            </Link>
          </li>
        ))}
      </ol>
      <p className={cn("m-0 mt-2", OPERATOR_TYPE_SCALE.meta, "text-neutral-600 dark:text-neutral-400")}>
        Next: {steps[0].nextAction}{" "}
        <Link href="/help/first-hour-operator-path" className="text-teal-900 underline dark:text-teal-100">
          Read the canonical guide
        </Link>
      </p>
    </section>
  );
}
