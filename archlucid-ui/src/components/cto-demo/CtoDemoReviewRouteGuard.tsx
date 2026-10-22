"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { Button } from "@/components/ui/button";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { getShowcaseSponsorHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type CtoDemoReviewRouteGuardProps = {
  readonly runId: string;
};

/**
 * When the CTO tour is active, warn presenters who navigate to a non-showcase review.
 */
export function CtoDemoReviewRouteGuard(props: CtoDemoReviewRouteGuardProps): React.JSX.Element | null {
  const { runId } = props;
  const [tourActive, setTourActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setTourActive(readBuyerCtoDemoTourActive() && isBuyerPolishedOperatorShellEnv());
  }, []);

  if (!tourActive || dismissed) {
    return null;
  }

  const canonicalRunId = canonicalizeDemoRunId(runId);
  const showcaseRunId = canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID);

  if (canonicalRunId === showcaseRunId) {
    return null;
  }

  return (
    <div
      className="relative z-50 mb-4 rounded-lg border border-amber-300 bg-white/95 p-4 shadow-md dark:border-amber-800 dark:bg-neutral-950/95"
      data-testid="cto-demo-review-route-guard"
      role="alert"
    >
      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        CTO demo is active — this review is not part of the demo.
      </p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        Jump to the Claims Intake showcase to stay on the five-step diligence path.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" asChild>
          <Link href={getShowcaseSponsorHref()} data-testid="cto-demo-review-route-guard-showcase">
            Go to showcase
          </Link>
        </Button>
        <DismissControl data-testid="cto-demo-review-route-guard-dismiss" onDismiss={() => {
            setDismissed(true);
          }} />
      </div>
    </div>
  );
}
