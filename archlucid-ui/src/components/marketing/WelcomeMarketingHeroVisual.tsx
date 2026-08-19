import Link from "next/link";

import { WELCOME_SEE_IT_HREF } from "@/components/marketing/welcome-marketing-copy";
import { SeverityTag } from "@/components/ui/severity-tag";
import { MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Static sample-review frame for the welcome hero — links to the live `/see-it` proof slice. */
export function WelcomeMarketingHeroVisual(): React.JSX.Element {
  return (
    <Link
      href={WELCOME_SEE_IT_HREF}
      className={cn(
        "group block rounded-lg border border-neutral-200 bg-al-surface-raised text-left shadow-sm transition-shadow hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
        "dark:border-neutral-700 dark:bg-neutral-900",
        MARKETING_MOTION.heroVisual,
      )}
      data-testid="welcome-hero-product-visual"
      aria-label="See a finalized sample review — open the public proof slice"
    >
      <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
          Healthcare Claims intake modernization
        </p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
          Sealed review record · Policy pack v1.2 · Fabricated sample data
        </p>
      </div>
      <div className="space-y-3 px-4 py-4">
        <div className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityTag severity="high" />
            <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
              Cross-region data residency gap
            </p>
          </div>
          <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            PHI processing region does not match the declared backup residency control in the submitted evidence.
          </p>
          <p className={cn("m-0 mt-3", MARKETING_TYPOGRAPHY.meta)}>
            <span className="font-semibold text-al-text-primary">Evidence:</span>{" "}
            <span className={MARKETING_SURFACES.inlineLink}>network-topology.json</span>
            {" · "}
            <span className={MARKETING_SURFACES.inlineLink}>policy-pack-rule-14</span>
          </p>
        </div>
        <p className={cn("m-0 text-center", MARKETING_SURFACES.inlineLink, MARKETING_TYPOGRAPHY.meta)}>
          Inspect the full sample review →
        </p>
      </div>
    </Link>
  );
}
