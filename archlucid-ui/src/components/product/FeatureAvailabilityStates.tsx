import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Full-width empty state for routes that are not available in the current workspace (demo or tier).
 */
export function FeatureNotAvailable() {
  return (
    <Card
      className="border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
      data-testid="feature-not-available"
    >
      <CardContent className="px-6 py-8 text-center">
        <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          This feature is not enabled in this workspace
        </h2>
        <p className={cn("mx-auto mt-2 max-w-md text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Contact your administrator to enable it, or explore what is available from the navigation.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * CTA for views that require a finalized run first.
 */
export function AvailableAfterFirstRun() {
  return (
    <Card
      className="border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
      data-testid="available-after-first-run"
    >
      <CardContent className="px-6 py-8 text-center">
        <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Available after your first finalized review
        </h2>
        <p className={cn("mx-auto mt-2 max-w-md text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Complete an architecture request and finalize the review to unlock this view.
        </p>
        <Button asChild variant="primary" className="mt-4" type="button">
          <Link href="/architecture/reviews/new">Start a new request</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
