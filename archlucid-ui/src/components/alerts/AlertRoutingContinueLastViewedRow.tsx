"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AlertRoutingContinueLastTarget } from "@/lib/resolve-continue-last-alert-routing-subscription";
import { cn } from "@/lib/utils";

export type AlertRoutingContinueLastViewedRowProps = {
  readonly target: AlertRoutingContinueLastTarget;
  readonly onOpen: (subscriptionId: string) => void;
};

/** Pinned continue row for the most recently viewed alert-routing subscription. */
export function AlertRoutingContinueLastViewedRow(
  props: AlertRoutingContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="alert-routing-continue-last-viewed-heading"
      className="mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="alert-routing-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="alert-routing-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed subscription
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.name}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="alert-routing-continue-last-viewed-open"
          onClick={() => {
            props.onOpen(props.target.subscriptionId);
          }}
        >
          Open subscription
        </Button>
      </div>
    </section>
  );
}
