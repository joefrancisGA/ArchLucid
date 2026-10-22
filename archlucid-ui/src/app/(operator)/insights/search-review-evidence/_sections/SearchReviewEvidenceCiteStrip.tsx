import Link from "next/link";

import { buyerAskGroundingLinksForRun } from "@/lib/ask-buyer-grounding-links";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type SearchReviewEvidenceCiteStripProps = {
  readonly runId: string;
};

/** Sponsor-safe Sources when search is scoped to one review — review / evidence / audit cites. */
export function SearchReviewEvidenceCiteStrip(props: SearchReviewEvidenceCiteStripProps) {
  const links = buyerAskGroundingLinksForRun(props.runId);

  if (links === null || links.length === 0) {
    return null;
  }

  return (
    <section
      className="mb-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      aria-labelledby="search-review-evidence-cite-heading"
      data-testid="search-review-evidence-cite-strip"
    >
      <h3
        id="search-review-evidence-cite-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Sources for this review
      </h3>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Open the finalized review context, evidence trail, or audit trail before treating search snippets as
        authoritative.
      </p>
      <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
        {links.map((link) => (
          <li key={link.href}>
            <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
