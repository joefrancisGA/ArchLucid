"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  FIRST_REVIEW_OPEN_GATE_STARTER_HEADING,
  FIRST_REVIEW_OPEN_GATE_STARTER_HREF,
  FIRST_REVIEW_OPEN_GATE_STARTER_LEAD,
  FIRST_REVIEW_OPEN_GATE_STARTER_NOT_THIS_REVIEW,
} from "@/lib/architecture/first-review-open-gate-starter-copy";
import { isLiveOperatorShellRecoveryContext } from "@/lib/live-operator-shell-recovery";
import { cn } from "@/lib/utils";

/** One-click sample review with the first-review spine open gate in the overview viewport. */
export function FirstReviewOpenGateStarterShortcut(): React.JSX.Element | null {
  if (isLiveOperatorShellRecoveryContext()) {
    return null;
  }

  return (
    <section
      aria-labelledby="first-review-open-gate-starter-heading"
      aria-describedby="first-review-open-gate-starter-lead first-review-open-gate-starter-not-this-review"
      className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/60 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
      data-testid="first-review-open-gate-starter-shortcut"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="first-review-open-gate-starter-heading"
              className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}
            >
              {FIRST_REVIEW_OPEN_GATE_STARTER_HEADING}
            </h2>
            <DemoDataBadge />
          </div>
          <p
            id="first-review-open-gate-starter-lead"
            className={cn("m-0 max-w-2xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          >
            {FIRST_REVIEW_OPEN_GATE_STARTER_LEAD}
          </p>
          <p
            id="first-review-open-gate-starter-not-this-review"
            className={cn("m-0 max-w-2xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          >
            {FIRST_REVIEW_OPEN_GATE_STARTER_NOT_THIS_REVIEW}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          asChild
          data-testid="first-review-open-gate-starter-open"
        >
          <Link
            href={FIRST_REVIEW_OPEN_GATE_STARTER_HREF}
            aria-describedby="first-review-open-gate-starter-lead first-review-open-gate-starter-not-this-review"
          >
            Open sample open gate
          </Link>
        </Button>
      </div>
    </section>
  );
}
