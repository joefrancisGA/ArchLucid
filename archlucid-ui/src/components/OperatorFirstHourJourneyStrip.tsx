import { cn } from "@/lib/utils";
import Link from "next/link";

import { OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS } from "@/lib/operator-first-hour-journey-nav";
import {
  OPERATOR_HOME_SECTION_HEADING,
  OPERATOR_LINK,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";

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
      <h3 className={cn(OPERATOR_HOME_SECTION_HEADING, "text-al-text-primary")}>
        First-hour path
      </h3>
      <p className={cn("m-0 mt-2 max-w-prose", OPERATOR_TYPE_SCALE.body, "text-al-text-secondary")}>
        Pilot first, Operate later — complete one review package before opening analysis or governance depth.
      </p>
      <ol className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-2 p-0", OPERATOR_TYPE_SCALE.body)}>
        {steps.map((item) => (
          <li key={item.step} className="min-w-0">
            <Link
              href={item.href}
              title={item.chipTooltip}
              className={OPERATOR_LINK.step}
            >
              <span className="tabular-nums text-al-text-secondary">{item.step}.</span> {item.label}
            </Link>
          </li>
        ))}
      </ol>
      <p className={cn("m-0 mt-2", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
        Next: {steps[0].nextAction}{" "}
        <Link href="/help/first-hour-operator-path" className={OPERATOR_LINK.inline}>
          Read the canonical guide
        </Link>
      </p>
    </section>
  );
}
