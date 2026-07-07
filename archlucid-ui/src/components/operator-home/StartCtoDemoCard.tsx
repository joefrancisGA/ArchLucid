"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EXPLORE_ARCHLUCID_ROW_CLASS } from "@/components/operator-home/explore-archlucid-row-class";
import {
  BUYER_HOME_START_CTO_DEMO_ARIA,
  BUYER_HOME_START_CTO_DEMO_CTA,
  BUYER_HOME_START_CTO_DEMO_HEADING,
  BUYER_HOME_START_CTO_DEMO_LEAD,
} from "@/lib/buyer-polish-copy";
import { getStartCtoDemoTourHref } from "@/lib/buyer-cto-demo-tour";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Buyer-facing example review row inside Explore ArchLucid. */
export function StartCtoDemoCard(): React.JSX.Element {
  const startHref = getStartCtoDemoTourHref();

  return (
    <section
      aria-label={BUYER_HOME_START_CTO_DEMO_ARIA}
      data-testid="start-cto-demo-card"
      className={EXPLORE_ARCHLUCID_ROW_CLASS}
    >
      <h3 id="start-cto-demo-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {BUYER_HOME_START_CTO_DEMO_HEADING}
      </h3>
      <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {BUYER_HOME_START_CTO_DEMO_LEAD}
      </p>
      <div className="mt-3">
        <Button asChild className="w-full justify-center sm:w-auto">
          <Link href={startHref} data-testid="start-cto-demo-cta">
            {BUYER_HOME_START_CTO_DEMO_CTA}
          </Link>
        </Button>
      </div>
    </section>
  );
}
