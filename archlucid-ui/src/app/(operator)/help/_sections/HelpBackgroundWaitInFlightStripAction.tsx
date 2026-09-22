"use client";

import { Button } from "@/components/ui/button";
import { useShellInFlightOperations } from "@/hooks/use-shell-in-flight-operations";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { requestOpenShellInFlightOperations } from "@/lib/operations/open-shell-in-flight-event";
import { isTerminalOperationState } from "@/lib/operations/operation-state";
import { REVIEW_PIPELINE_OPEN_IN_FLIGHT_STRIP_LABEL } from "@/lib/review-execution-background-safety-copy";
import { cn } from "@/lib/utils";

export type HelpBackgroundWaitInFlightStripActionProps = {
  readonly ariaKeyShortcuts?: string;
};

/** Live shell in-flight strip opener for the background-wait help resume section (DW-015). */
export function HelpBackgroundWaitInFlightStripAction(
  props: HelpBackgroundWaitInFlightStripActionProps,
): React.JSX.Element {
  const operations = useShellInFlightOperations();
  const inFlightCount = operations.filter((row) => !isTerminalOperationState(row.state)).length;
  const countLabel = inFlightCount === 0 ? "None in progress" : `${inFlightCount} in progress`;

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      data-testid="help-background-wait-in-flight-strip-action"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Tracked operations: <span className="font-medium text-al-text-primary">{countLabel}</span>
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="help-background-wait-open-in-flight-strip"
        aria-label={`${REVIEW_PIPELINE_OPEN_IN_FLIGHT_STRIP_LABEL} — ${countLabel}`}
        aria-keyshortcuts={props.ariaKeyShortcuts}
        onClick={() => {
          requestOpenShellInFlightOperations();
        }}
      >
        {REVIEW_PIPELINE_OPEN_IN_FLIGHT_STRIP_LABEL}
      </Button>
    </div>
  );
}
