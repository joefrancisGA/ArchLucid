import Link from "next/link";

import {
  SEE_IT_CLAIM_DISCIPLINE,
  SEE_IT_SOURCES,
  SEE_IT_SOURCES_INTRO,
} from "@/lib/see-it-evidence-copy";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Evaluation Sources + claim discipline for `/see-it` (SEE Evidence). */
export function SeeItEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="mt-10 space-y-3 text-left" data-testid="see-it-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="see-it-sources-heading"
        data-testid="see-it-sources"
      >
        <h2
          id="see-it-sources-heading"
          className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          {SEE_IT_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", MARKETING_TYPOGRAPHY.body)}>
          {SEE_IT_SOURCES.map((link) => (
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
        data-testid="see-it-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
          Illustrative sample only
        </h2>
        <p className={cn("m-0 mt-2", MARKETING_TYPOGRAPHY.body)}>{SEE_IT_CLAIM_DISCIPLINE}</p>
      </aside>
    </div>
  );
}
