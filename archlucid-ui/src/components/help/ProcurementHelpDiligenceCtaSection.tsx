import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  PROCUREMENT_HELP_DILIGENCE_PRIMARY_CTAS,
  PROCUREMENT_HELP_DILIGENCE_SECONDARY_CTAS,
} from "@/lib/procurement-help-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Buyer diligence next steps for `/help/procurement` (TB-1256). */
export function ProcurementHelpDiligenceCtaSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="procurement-help-diligence-ctas-heading"
      className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950/40"
      data-testid="procurement-help-diligence-ctas"
    >
      <h2
        id="procurement-help-diligence-ctas-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Diligence next steps
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Start with public assurance surfaces, then open contract templates or request NDA-gated materials through
        Settings Security &amp; trust or sales.
      </p>
      <ul className={cn("m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        {PROCUREMENT_HELP_DILIGENCE_PRIMARY_CTAS.map((cta) => (
          <li key={cta.href} className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
            <Button asChild size="sm" variant="primary" data-testid={cta.testId}>
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{cta.description}</p>
          </li>
        ))}
      </ul>
      <div className={cn("mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Need a full procurement pack?</p>
        <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {PROCUREMENT_HELP_DILIGENCE_SECONDARY_CTAS.map((cta) => (
            <li key={cta.href}>
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={cta.href} data-testid={cta.testId}>
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
