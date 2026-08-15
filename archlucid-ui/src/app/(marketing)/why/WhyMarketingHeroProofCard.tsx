import Link from "next/link";

import { MARKETING_MOTION, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { WHY_HERO_PRIMARY_CTA_HREF } from "@/lib/why-page-copy";
import { cn } from "@/lib/utils";

/** Near-hero proof artifact — makes the governed review tangible before the reader scrolls. */
export function WhyMarketingHeroProofCard(): React.JSX.Element {
  return (
    <Link
      href={WHY_HERO_PRIMARY_CTA_HREF}
      className={cn(
        "group block rounded-lg border border-neutral-200 bg-al-surface-raised text-left shadow-sm transition-shadow hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
        "dark:border-neutral-700 dark:bg-neutral-900",
        MARKETING_MOTION.heroVisual,
      )}
      data-testid="why-hero-proof-card"
      aria-label="See a finalized sample review — open the public proof slice"
    >
      <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
          Healthcare Claims intake modernization
        </p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
          Review AL-2841 · 12 findings · 3 approvals · 47 evidence references
        </p>
      </div>
      <div className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[13px] font-semibold text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950">
            Finalized and signed
          </span>
          <span className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
            Sealed review record · Policy pack v1.2 · Fabricated sample data
          </span>
        </div>
        <p className={cn("m-0 text-teal-800 group-hover:underline dark:text-teal-300", MARKETING_TYPOGRAPHY.meta)}>
          Inspect the full sample review →
        </p>
      </div>
    </Link>
  );
}
