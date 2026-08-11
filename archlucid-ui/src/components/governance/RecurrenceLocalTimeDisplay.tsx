import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RecurrenceLocalTimeSummary } from "@/lib/recurrence-local-time";
import { cn } from "@/lib/utils";

export type RecurrenceLocalTimeDisplayProps = {
  readonly summary: RecurrenceLocalTimeSummary;
  readonly primaryTestId?: string;
  readonly secondaryTestId?: string;
  readonly className?: string;
};

/** Local-first cadence/instant lines with UTC as secondary technical detail (TB-2210). */
export function RecurrenceLocalTimeDisplay(props: RecurrenceLocalTimeDisplayProps) {
  const { summary, primaryTestId, secondaryTestId, className } = props;

  return (
    <div className={cn("space-y-0.5", className)}>
      <p
        className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
        data-testid={primaryTestId}
      >
        {summary.localPrimary}
      </p>
      {summary.utcSecondary.trim().length > 0 ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={secondaryTestId}
        >
          Server schedule (UTC): {summary.utcSecondary}
        </p>
      ) : null}
    </div>
  );
}
