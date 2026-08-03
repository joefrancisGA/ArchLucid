import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

const PRIMARY_HREF = "/architecture/reviews/new";
const PRIMARY_LABEL = "Start your first review";
const FIRST_REVIEW_HELP_HREF = inAppHelpHref("first-architecture-review");

/**
 * First-screen operator orientation: one primary first-review action and at most three secondary links.
 */
export function OperatorPilotOrientationBanner() {
  return (
    <section
      aria-labelledby="operator-pilot-orientation-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="operator-pilot-orientation"
    >
      <h2 id="operator-pilot-orientation-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
        Your first architecture review
      </h2>
      <p className={`mt-2 max-w-3xl ${OPERATOR_TYPOGRAPHY.body}`}>
        Run one governed architecture review, finalize the package, then collect proof before any sponsor handoff.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild size="sm">
          <Link href={PRIMARY_HREF} data-testid="operator-pilot-primary-action">
            {PRIMARY_LABEL}
          </Link>
        </Button>
        <nav aria-label="First review secondary links" className="flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href={FIRST_REVIEW_HELP_HREF}
            className={`${OPERATOR_TYPOGRAPHY.helper} text-al-accent-interactive underline-offset-2 hover:underline`}
            data-testid="operator-pilot-secondary-first-run"
          >
            First-review walkthrough
          </Link>
          <Link
            href="/architecture/reviews"
            className={`${OPERATOR_TYPOGRAPHY.helper} text-al-accent-interactive underline-offset-2 hover:underline`}
            data-testid="operator-pilot-secondary-reviews"
          >
            Reviews
          </Link>
        </nav>
      </div>
    </section>
  );
}
