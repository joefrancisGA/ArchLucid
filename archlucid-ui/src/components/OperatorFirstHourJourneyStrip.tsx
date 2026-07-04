"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { OperatorGuidanceNextLabel } from "@/components/OperatorGuidanceNextLabel";
import {
  OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS,
  resolveOperatorFirstHourJourneyNav,
} from "@/lib/operator-first-hour-journey-nav";
import {
  OPERATOR_HOME_SECTION_HEADING,
  OPERATOR_LINK,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";

/**
 * Compact four-step first-hour path for standard operator Home — Pilot first, Operate later.
 */
export function OperatorFirstHourJourneyStrip() {
  const pathname = usePathname();
  const steps = OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS;
  const journeyNav = resolveOperatorFirstHourJourneyNav(pathname ?? "/");
  const currentStepIndex = journeyNav?.currentStepIndex ?? null;
  const recommendedStepIndex = currentStepIndex === null ? 0 : null;

  return (
    <section
      role="region"
      id="operator-first-hour-path"
      aria-label="First-hour path"
      className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800"
      data-testid="operator-first-hour-journey-strip"
    >
      <h3 className={cn(OPERATOR_HOME_SECTION_HEADING, "text-al-text-primary")}>
        First-hour path
      </h3>
      <p className={cn("m-0 mt-2 max-w-prose", OPERATOR_TYPE_SCALE.body, "text-al-text-secondary")}>
        Pilot first, Operate later — complete one review package before opening analysis or governance depth.
      </p>
      <ol
        className={cn("m-0 mt-2 flex list-none flex-wrap items-center gap-x-1.5 gap-y-2 p-0", OPERATOR_TYPE_SCALE.body)}
        aria-label="First-hour path steps"
      >
        {steps.map((item, index) => (
          <li key={item.step} className="inline-flex min-w-0 items-center gap-1.5">
            <Link
              href={item.href}
              title={item.chipTooltip}
              aria-label={`Step ${item.step}: ${item.label}`}
              aria-current={currentStepIndex === index ? "step" : undefined}
              data-testid={`operator-first-hour-step-${item.step}`}
              className={cn(
                OPERATOR_LINK.stepPill,
                currentStepIndex === index && OPERATOR_LINK.stepPillCurrent,
                recommendedStepIndex === index && OPERATOR_LINK.stepPillRecommended,
              )}
            >
              <span className="tabular-nums font-semibold text-al-text-secondary" aria-hidden>
                {item.step}
              </span>
              <span>{item.label}</span>
            </Link>
            {index < steps.length - 1 ? (
              <span className={cn(OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary/60")} aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <p
        className={cn("m-0 mt-2", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
        data-testid="operator-first-hour-next-guidance"
      >
        <OperatorGuidanceNextLabel /> {steps[0].nextAction}{" "}
        <Link href="/help/first-hour-operator-path" className={OPERATOR_LINK.inline}>
          Read the first-review guide
        </Link>
      </p>
    </section>
  );
}
