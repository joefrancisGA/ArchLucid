import Link from "next/link";

import {
  REVIEW_GUIDE_HELP_MORE_RELATED_GUIDES,
  REVIEW_GUIDE_HELP_RELATED_GUIDES,
} from "@/lib/review-guide-help-guide-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function ReviewGuideRelatedGuideLinks({
  links,
  testIdPrefix,
}: {
  readonly links: readonly { readonly label: string; readonly href: string }[];
  readonly testIdPrefix: string;
}): React.ReactElement {
  return (
    <ul
      className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}
      data-testid={`${testIdPrefix}-links`}
    >
      {links.map((link) => (
        <li key={`${link.href}-${link.label}`}>
          <Link
            className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
            href={link.href}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Trimmed related guides for `/help/review-guide` (TB-1262). */
export function HelpReviewGuideRelatedGuidesSection(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-review-guide-related-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-review-guide-related-guides"
      id="related-guides"
    >
      <h2
        id="help-review-guide-related-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Related guides
      </h2>
      <div className="mt-2 space-y-3">
        <ReviewGuideRelatedGuideLinks links={REVIEW_GUIDE_HELP_RELATED_GUIDES} testIdPrefix="help-review-guide-related-primary" />
        <details data-testid="help-review-guide-related-more">
          <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            More help
          </summary>
          <div className="mt-2">
            <ReviewGuideRelatedGuideLinks
              links={REVIEW_GUIDE_HELP_MORE_RELATED_GUIDES}
              testIdPrefix="help-review-guide-related-more"
            />
          </div>
        </details>
      </div>
    </section>
  );
}
