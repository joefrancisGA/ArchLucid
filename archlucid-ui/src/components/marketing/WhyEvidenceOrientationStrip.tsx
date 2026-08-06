import Link from "next/link";

import {
  WHY_CLAIM_DISCIPLINE,
  WHY_SOURCES,
  WHY_SOURCES_INTRO,
} from "@/lib/why-evidence-copy";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Evaluation Sources + claim discipline for `/why` (WHY Evidence). */
export function WhyEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="mt-6 space-y-3 text-left" data-testid="why-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="why-sources-heading"
        data-testid="why-sources"
      >
        <h2
          id="why-sources-heading"
          className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          {WHY_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", MARKETING_TYPOGRAPHY.body)}>
          {WHY_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link
                className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside
        className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
        data-testid="why-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
          Marketing comparison only
        </h2>
        <p className={cn("m-0 mt-2", MARKETING_TYPOGRAPHY.body)}>{WHY_CLAIM_DISCIPLINE}</p>
      </aside>
    </div>
  );
}
