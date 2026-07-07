"use client";

import Link from "next/link";

import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { ShortcutHint } from "@/components/ShortcutHint";
import { Button } from "@/components/ui/button";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showcaseSampleReviewPackageHref } from "@/lib/showcase-sample-review-registry";
import { cn } from "@/lib/utils";

import {
  REVIEWS_HUB_PRIMARY_LOAD_SAMPLE_LABEL,
  REVIEWS_HUB_PRIMARY_START_LABEL,
  REVIEWS_HUB_PRIMARY_VIEW_SAMPLE_LABEL,
} from "./reviews-hub-copy";

/** Primary workflow actions for the `/reviews` hub. */
export function ReviewsHubPrimaryActions(): React.JSX.Element {
  const fullShell = isOperatorExperienceFullShellEnv();

  return (
    <section
      className="mt-4 flex flex-wrap items-center gap-2"
      data-testid="reviews-hub-primary-actions"
      aria-label="Review package actions"
    >
      <div className="inline-flex items-center gap-1.5">
        <Button variant="primary" size="sm" asChild>
          <Link href="/reviews/new" className="no-underline" data-testid="runs-page-start-review">
            {REVIEWS_HUB_PRIMARY_START_LABEL}
          </Link>
        </Button>
        {fullShell ? <ShortcutHint shortcut="Alt+N" className={OPERATOR_TYPOGRAPHY.helper} /> : null}
      </div>
      <SeedSampleReviewButton variant="secondary" size="sm" label={REVIEWS_HUB_PRIMARY_LOAD_SAMPLE_LABEL} />
      <Button variant="outline" size="sm" asChild>
        <Link
          href={showcaseSampleReviewPackageHref()}
          className={cn("no-underline")}
          data-testid="reviews-hub-view-sample-package"
        >
          {REVIEWS_HUB_PRIMARY_VIEW_SAMPLE_LABEL}
        </Link>
      </Button>
      {fullShell ? (
        <Button variant="outline" size="sm" asChild>
          <Link href="/compare" className="no-underline">
            Compare two reviews
          </Link>
        </Button>
      ) : null}
    </section>
  );
}
