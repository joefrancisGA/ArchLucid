"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DigestSubscriptionsContinueLastTarget } from "@/lib/resolve-continue-last-digest-subscription";
import { cn } from "@/lib/utils";

export type DigestSubscriptionsContinueLastViewedRowProps = {
  readonly target: DigestSubscriptionsContinueLastTarget;
  readonly onOpen: (subscriptionId: string) => void;
};

/** Pinned continue row for the most recently viewed digest subscription. */
export function DigestSubscriptionsContinueLastViewedRow(
  props: DigestSubscriptionsContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="digest-subscriptions-continue-last-viewed-heading"
      className="mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="digest-subscriptions-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="digest-subscriptions-continue-last-viewed-heading"
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
          data-testid="digest-subscriptions-continue-last-viewed-open"
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
