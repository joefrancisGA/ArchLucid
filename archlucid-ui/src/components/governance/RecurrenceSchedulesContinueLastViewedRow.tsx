"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import type { RecurrenceSchedulesContinueLastTarget } from "@/lib/resolve-continue-last-recurrence-schedule";
import { cn } from "@/lib/utils";

export type RecurrenceSchedulesContinueLastViewedRowProps = {
  readonly target: RecurrenceSchedulesContinueLastTarget;
  readonly onOpen: (scheduleId: string) => void;
};

/** Pinned continue row for the most recently viewed recurrence schedule. */
export function RecurrenceSchedulesContinueLastViewedRow(
  props: RecurrenceSchedulesContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="recurrence-schedules-continue-last-viewed-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="recurrence-schedules-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="recurrence-schedules-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed schedule
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.name}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="recurrence-schedules-continue-last-viewed-open"
          onClick={() => {
            props.onOpen(props.target.scheduleId);
          }}
        >
          Open schedule
        </Button>
      </div>
    </section>
  );
}
