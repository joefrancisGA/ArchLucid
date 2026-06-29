"use client";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  BUYER_HOME_START_CTO_DEMO_ARIA,
  BUYER_HOME_START_CTO_DEMO_CTA,
  BUYER_HOME_START_CTO_DEMO_HEADING,
  BUYER_HOME_START_CTO_DEMO_LEAD,
} from "@/lib/buyer-polish-copy";
import { evaluateBuyerCtoDemoReadiness } from "@/lib/buyer-cto-demo-readiness";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getStartCtoDemoTourHref } from "@/lib/buyer-cto-demo-tour";

/** Primary buyer-polished CTA — lands on step 1 of the golden journey without setup or pipeline wait. */
export function StartCtoDemoCard(): React.JSX.Element {
  const startHref = getStartCtoDemoTourHref();
  const [canStart, setCanStart] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void evaluateBuyerCtoDemoReadiness().then((result) => {
      if (cancelled) {
        return;
      }

      setCanStart(result.verdict !== "not-ready");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      aria-label={BUYER_HOME_START_CTO_DEMO_ARIA}
      data-testid="start-cto-demo-card"
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <h2 id="start-cto-demo-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {BUYER_HOME_START_CTO_DEMO_HEADING}
      </h2>
      <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {BUYER_HOME_START_CTO_DEMO_LEAD}
      </p>
      <div className="mt-3">
        {canStart ? (
          <Button asChild className="w-full justify-center sm:w-auto">
            <Link href={startHref} data-testid="start-cto-demo-cta">
              {BUYER_HOME_START_CTO_DEMO_CTA}
            </Link>
          </Button>
        ) : (
          <Button className="w-full justify-center sm:w-auto" disabled data-testid="start-cto-demo-cta">
            {BUYER_HOME_START_CTO_DEMO_CTA}
          </Button>
        )}
      </div>
      {!canStart ? (
        <p className={cn("m-0 mt-2 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.body)}>
          Demo preflight failed — resolve the checklist above before starting the CTO demo.
        </p>
      ) : null}
    </section>
  );
}

