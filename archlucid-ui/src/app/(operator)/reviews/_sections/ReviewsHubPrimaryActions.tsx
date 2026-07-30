"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Quiet Start guidance under the header — primary CTA lives in header actions (TB-1541).
 */
export function ReviewsHubPrimaryActions(): React.JSX.Element {
  return (
    <section className="mt-4" data-testid="reviews-hub-primary-actions" aria-label="Start an architecture review">
      <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        You can describe or import an architecture inside the review flow — the review remains the durable work item.
      </p>
    </section>
  );
}
