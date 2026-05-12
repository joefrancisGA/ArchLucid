import Link from "next/link";

import {
  getShowcaseExecutiveHref,
  getShowcaseManifestHref,
} from "@/lib/buyer-safe-review-navigation";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);

/**
 * Compact five-step golden path for buyer-polished home — one primary narrative instead of many equal-weight CTAs.
 */
export function BuyerGoldenJourneyStrip() {
  const steps: { readonly step: number; readonly label: string; readonly href: string }[] = [
    { step: 1, label: "Executive Summary", href: getShowcaseExecutiveHref() },
    { step: 2, label: "Signed manifest", href: getShowcaseManifestHref() },
    { step: 3, label: "Evidence graph", href: `/graph?runId=${showcaseRunEnc}` },
    { step: 4, label: "Governance", href: `/governance?runId=${showcaseRunEnc}` },
    { step: 5, label: "Audit trail", href: `/audit?runId=${showcaseRunEnc}` },
  ];

  return (
    <section
      aria-label="Recommended review journey"
      className="rounded-lg border border-teal-200/80 bg-teal-50/50 px-3 py-3 dark:border-teal-900/60 dark:bg-teal-950/25"
    >
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-teal-900 dark:text-teal-200">
        Review journey
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
