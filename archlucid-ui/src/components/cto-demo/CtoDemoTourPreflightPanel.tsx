"use client";

import { usePathname, useRouter } from "next/navigation";

import { CtoDemoCustomerPreflightGate } from "@/components/cto-demo/CtoDemoCustomerPreflightGate";
import { Button } from "@/components/ui/button";
import {
  getStartCtoDemoTourHref,
  readBuyerCtoDemoPreflightAcknowledged,
  writeBuyerCtoDemoTourCollapsed,
} from "@/lib/buyer/buyer-cto-demo-tour";
import {
  BUYER_CTO_DEMO_TOUR_ARIA,
  BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA,
  BUYER_CTO_DEMO_TOUR_END_CTA,
  BUYER_CTO_DEMO_TOUR_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CtoDemoTourPreflightPanelProps = {
  onAcknowledged: () => void;
  onCollapse: () => void;
  onEndTour: () => void;
};

export function CtoDemoTourPreflightPanel({
  onAcknowledged,
  onCollapse,
  onEndTour,
}: CtoDemoTourPreflightPanelProps): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  return (
    <aside
      aria-label={BUYER_CTO_DEMO_TOUR_ARIA}
      className="pointer-events-none fixed bottom-4 right-4 z-[9990] w-[min(22rem,calc(100vw-2rem))] print:hidden"
      data-testid="buyer-cto-demo-tour-overlay"
    >
      <div className="pointer-events-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.badge, "text-neutral-500 dark:text-neutral-400")}>
            {BUYER_CTO_DEMO_TOUR_HEADING}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 px-2 text-neutral-600 dark:text-neutral-400"
            aria-label={BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA}
            onClick={() => {
              onCollapse();
              writeBuyerCtoDemoTourCollapsed(true);
            }}
          >
            {BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA}
          </Button>
        </div>
        <CtoDemoCustomerPreflightGate
          onAcknowledged={() => {
            onAcknowledged();

            if (!readBuyerCtoDemoPreflightAcknowledged()) {
              return;
            }

            const destination = getStartCtoDemoTourHref();
            const destinationPath = destination.split("?")[0] ?? destination;

            if (pathname !== destinationPath) {
              router.push(destination);
            }
          }}
        />
        <div className="mt-3">
          <Button type="button" variant="outline" size="sm" className="text-neutral-600 dark:text-neutral-400" onClick={onEndTour}>
            {BUYER_CTO_DEMO_TOUR_END_CTA}
          </Button>
        </div>
      </div>
    </aside>
  );
}
