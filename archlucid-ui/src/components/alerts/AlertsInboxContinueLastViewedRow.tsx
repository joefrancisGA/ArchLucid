"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import type { AlertsInboxContinueLastTarget } from "@/lib/resolve-continue-last-alert";
import { cn } from "@/lib/utils";

export type AlertsInboxContinueLastViewedRowProps = {
  readonly target: AlertsInboxContinueLastTarget;
  readonly onOpen: (alertId: string) => void;
};

/** Pinned continue row for the most recently viewed inbox alert. */
export function AlertsInboxContinueLastViewedRow(
  props: AlertsInboxContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="alerts-inbox-continue-last-viewed-heading"
      className={OPERATOR_RESUME.stripCompact}
      data-testid="alerts-inbox-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="alerts-inbox-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed alert
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.title}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="alerts-inbox-continue-last-viewed-open"
          onClick={() => {
            props.onOpen(props.target.alertId);
          }}
        >
          Open alert
        </Button>
      </div>
    </section>
  );
}
