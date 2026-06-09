import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  BUYER_HOME_START_CTO_DEMO_ARIA,
  BUYER_HOME_START_CTO_DEMO_CTA,
  BUYER_HOME_START_CTO_DEMO_HEADING,
  BUYER_HOME_START_CTO_DEMO_LEAD,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { getStartCtoDemoTourHref } from "@/lib/buyer-cto-demo-tour";
import { cn } from "@/lib/utils";

/** Primary buyer-polished CTA — lands on step 1 of the golden journey without setup or pipeline wait. */
export function StartCtoDemoCard(): React.JSX.Element {
  const startHref = getStartCtoDemoTourHref();

  return (
    <section
      aria-label={BUYER_HOME_START_CTO_DEMO_ARIA}
      data-testid="start-cto-demo-card"
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <h2 id="start-cto-demo-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle)}>
        {BUYER_HOME_START_CTO_DEMO_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
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
