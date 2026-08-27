"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import type { CompositeAlertRulesContinueLastTarget } from "@/lib/resolve-continue-last-composite-alert-rule";
import { cn } from "@/lib/utils";

export type CompositeAlertRulesContinueLastViewedRowProps = {
  readonly target: CompositeAlertRulesContinueLastTarget;
  readonly onOpen: (ruleId: string) => void;
};

/** Pinned continue row for the most recently viewed composite alert rule. */
export function CompositeAlertRulesContinueLastViewedRow(
  props: CompositeAlertRulesContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="composite-alert-rules-continue-last-viewed-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="composite-alert-rules-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="composite-alert-rules-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed rule
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.name}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="composite-alert-rules-continue-last-viewed-open"
          onClick={() => {
            props.onOpen(props.target.ruleId);
          }}
        >
          Open rule
        </Button>
      </div>
    </section>
  );
}
