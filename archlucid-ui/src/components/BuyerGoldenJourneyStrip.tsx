import { cn } from "@/lib/utils";
import Link from "next/link";

import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import { OPERATOR_HOME_SECTION_HEADING, OPERATOR_LINK, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";

/**
 * Compact five-step golden path for buyer-polished home — one primary narrative instead of many equal-weight CTAs.
 */
export function BuyerGoldenJourneyStrip() {
  const steps = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS;

  return (
    <section
      role="region"
      id="buyer-review-journey"
      aria-label="Recommended review journey"
      className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-3 py-3"
    >
      <h3 className={cn(OPERATOR_HOME_SECTION_HEADING, "text-al-text-primary")}>Review journey</h3>
      <p className={cn("m-0 mt-2 max-w-prose", OPERATOR_TYPE_SCALE.body, "text-al-text-secondary")}>
        Follow the finalized review from sponsor decision through signed review record, evidence graph, governance
        approval, and audit trail.
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
    </section>
  );
}
