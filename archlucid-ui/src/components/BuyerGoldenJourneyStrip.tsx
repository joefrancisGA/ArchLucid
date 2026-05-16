import Link from "next/link";

import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer-golden-journey-nav";

/**
 * Compact five-step golden path for buyer-polished home — one primary narrative instead of many equal-weight CTAs.
 */
export function BuyerGoldenJourneyStrip() {
  const steps = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS;

  return (
    <section
      id="buyer-review-journey"
      aria-label="Recommended review journey"
      className="rounded-lg border border-teal-200/80 bg-teal-50/50 px-3 py-3 dark:border-teal-900/60 dark:bg-teal-950/25"
    >
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-teal-900 dark:text-teal-200">
        Review journey
      </p>
      <p className="m-0 mt-2 max-w-prose text-xs leading-snug text-neutral-600 dark:text-neutral-400">
        Follow the finalized review record from executive decision through signed manifest, evidence graph, governance
        approval, and audit trail — the same sequence appears in the sidebar{" "}
        <strong className="font-medium text-neutral-800 dark:text-neutral-200">Review journey</strong> links.
      </p>
      <ol className="m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-2 p-0 text-sm">
        {steps.map((item) => (
          <li key={item.step} className="min-w-0">
            <Link
              href={item.href}
              className="font-medium text-teal-900 underline decoration-teal-300 underline-offset-2 hover:text-teal-950 dark:text-teal-100 dark:decoration-teal-700 dark:hover:text-teal-50"
            >
              <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{item.step}.</span> {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
