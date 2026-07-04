import Link from "next/link";

import { ExecutiveReviewsListClient } from "@/components/executive/ExecutiveReviewsListClient";
import { ExecutivePageHeader } from "@/components/executive/ExecutivePageHeader";
import { listRunsByProjectPaged } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import { EXECUTIVE_TYPOGRAPHY } from "@/lib/design-tokens";
import { tryStaticDemoRunSummariesPaged } from "@/lib/operator-static-demo";
import type { RunSummary } from "@/types/authority";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function isFinalizedReview(run: RunSummary): boolean {
  return run.hasGoldenManifest === true;
}

/**
 * Executive entry: finalized architecture reviews only (committed manifest).
 */
export default async function ExecutiveReviewsPage() {
  let runs: RunSummary[] = [];
  let loadError: string | null = null;

  try {
    const page = await listRunsByProjectPaged("default", 1, 40);
    runs = (page.items ?? []).filter(isFinalizedReview);
  } catch (e) {
    if (isApiRequestError(e) && e.httpStatus === 401) {
      loadError =
        "Sign in is required. Sign in with your organization account to access this view.";
    } else if (isApiRequestError(e) && e.httpStatus === 403) {
      loadError = "You do not have access to list reviews for this workspace.";
    } else {
      loadError = e instanceof Error ? e.message : "Could not load reviews.";
    }
  }

  if (runs.length === 0 && loadError === null) {
    const demoFallback = tryStaticDemoRunSummariesPaged("default");

    if (demoFallback !== null) {
      runs = demoFallback.items.filter(isFinalizedReview);
    }
  }

  if (runs.length === 0 && loadError !== null) {
    const demoFallback = tryStaticDemoRunSummariesPaged("default", { afterAuthorityListFailure: true });

    if (demoFallback !== null) {
      runs = demoFallback.items.filter(isFinalizedReview);
      loadError = null;
    }
  }

  return (
    <div className="space-y-6">
      <ExecutivePageHeader
        title="Architecture risk reviews"
        lead="Open a finalized review to see prioritized findings, evidence-linked detail, and export the architecture package."
      />

      {loadError !== null ? (
        <Card className="border-neutral-200 bg-al-surface-raised dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className={EXECUTIVE_TYPOGRAPHY.cardTitle}>Could not load reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className={cn("m-0", EXECUTIVE_TYPOGRAPHY.body)}>{loadError}</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="default" size="sm">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/reviews?projectId=default">Open review packages</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loadError === null && runs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className={EXECUTIVE_TYPOGRAPHY.cardTitle}>No finalized reviews yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className={cn("m-0", EXECUTIVE_TYPOGRAPHY.lead)}>
              Finalized reviews appear here after an operator completes the review and locks the architecture package.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="primary" size="sm">
                <Link href="/see-it">See a completed sample review</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/reviews/new">Start a review</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loadError === null && runs.length > 0 ? (
        <ExecutiveReviewsListClient runs={runs} />
      ) : null}
    </div>
  );
}
