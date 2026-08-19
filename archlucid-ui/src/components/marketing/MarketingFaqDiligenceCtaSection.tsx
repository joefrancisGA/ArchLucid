import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  MARKETING_FAQ_DILIGENCE_HEADING,
  MARKETING_FAQ_DILIGENCE_INTRO,
} from "@/lib/marketing/marketing-faq-page-copy";
import {
  MARKETING_FAQ_DILIGENCE_SECONDARY_CTAS,
} from "@/lib/marketing/marketing-faq-page-copy";
import { PROCUREMENT_HELP_DILIGENCE_PRIMARY_CTAS } from "@/lib/procurement-help-evidence-copy";
import { cn } from "@/lib/utils";

/** Buyer diligence next steps for `/faq` when security questions surface. */
export function MarketingFaqDiligenceCtaSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="marketing-faq-diligence-ctas-heading"
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="marketing-faq-diligence-ctas"
    >
      <h2
        id="marketing-faq-diligence-ctas-heading"
        className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.sectionTitle)}
      >
        {MARKETING_FAQ_DILIGENCE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{MARKETING_FAQ_DILIGENCE_INTRO}</p>
      <ul className={cn("m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2", MARKETING_TYPOGRAPHY.body)}>
        {PROCUREMENT_HELP_DILIGENCE_PRIMARY_CTAS.map((cta) => (
          <li key={cta.href} className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
            <Button asChild size="sm" variant="primary" data-testid={cta.testId}>
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
            <p className={cn("m-0 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>{cta.description}</p>
          </li>
        ))}
      </ul>
      <div className={cn("mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800", MARKETING_TYPOGRAPHY.body)}>
        <p className={cn("m-0 font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>Need a full procurement pack?</p>
        <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", MARKETING_TYPOGRAPHY.meta)}>
          {MARKETING_FAQ_DILIGENCE_SECONDARY_CTAS.map((cta) => (
            <li key={cta.href}>
              <Link className={MARKETING_SURFACES.inlineLink} href={cta.href} data-testid={cta.testId}>
                {cta.label}
              </Link>
              <span className="text-al-text-secondary"> — {cta.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
