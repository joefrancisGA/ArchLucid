import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  FIRST_REVIEW_OPEN_GATE_STARTER_HEADING,
  FIRST_REVIEW_OPEN_GATE_STARTER_HREF,
  FIRST_REVIEW_OPEN_GATE_STARTER_LEAD,
} from "@/lib/architecture/first-review-open-gate-starter-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
      <p className={OPERATOR_TYPOGRAPHY.body}>{FIRST_REVIEW_OPEN_GATE_STARTER_LEAD}</p>
      <Button asChild type="button" variant="primary" size="sm">
        <Link href={FIRST_REVIEW_OPEN_GATE_STARTER_HREF} data-testid="first-review-open-gate-starter-link">
          Open sample review
        </Link>
      </Button>
    </section>
  );
}
