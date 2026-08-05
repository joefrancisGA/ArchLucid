import Link from "next/link";

import { DIGESTS_SOURCES, DIGESTS_SOURCES_INTRO } from "@/lib/digests-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Sources for follow-up on the digests hub (DI Evidence).
 *
 * Owner decision 2026-08-05: no claim-boundary band here. The disclaimer read as
 * an internal drafting note to buyers; the page states what digests are in the
 * header lead instead.
 */
export function DigestsSourcesStrip(): React.JSX.Element {
  return (
    <div className="mt-4" data-testid="digests-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="digests-sources-heading"
        data-testid="digests-sources"
      >
        <h2
          id="digests-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {DIGESTS_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {DIGESTS_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
