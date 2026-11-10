import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  FIRST_REVIEW_OPEN_GATE_STARTER_HEADING,
  FIRST_REVIEW_OPEN_GATE_STARTER_HREF,
  FIRST_REVIEW_OPEN_GATE_STARTER_LEAD,
  FIRST_REVIEW_OPEN_GATE_STARTER_NOT_THIS_REVIEW,
} from "@/lib/architecture/first-review-open-gate-starter-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** One action: open the sample review on the first open gate. Not a tenant-sealed review. */
export function FirstReviewOpenGateStarter(): React.JSX.Element {
  return (
    <section
      className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      aria-labelledby="first-review-open-gate-starter-heading"
      data-testid="first-review-open-gate-starter"
    >
      <h2 id="first-review-open-gate-starter-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
        {FIRST_REVIEW_OPEN_GATE_STARTER_HEADING}
      </h2>
      <p id="first-review-open-gate-starter-lead" className={OPERATOR_TYPOGRAPHY.body}>
        {FIRST_REVIEW_OPEN_GATE_STARTER_LEAD}
      </p>
      <p
        id="first-review-open-gate-starter-not-this-review"
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      >
        {FIRST_REVIEW_OPEN_GATE_STARTER_NOT_THIS_REVIEW}
      </p>
      <Button asChild type="button" variant="primary" size="sm">
        <Link
          href={FIRST_REVIEW_OPEN_GATE_STARTER_HREF}
          data-testid="first-review-open-gate-starter-link"
          aria-describedby="first-review-open-gate-starter-lead first-review-open-gate-starter-not-this-review"
        >
          Open sample review
        </Link>
      </Button>
    </section>
  );
}
