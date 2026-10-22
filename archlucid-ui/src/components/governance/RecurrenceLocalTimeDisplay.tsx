import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RecurrenceLocalTimeSummary } from "@/lib/recurrence-local-time";
import { cn } from "@/lib/utils";

export type RecurrenceLocalTimeDisplayProps = {
  readonly summary: RecurrenceLocalTimeSummary;
  /** When set, overrides derived UTC cadence (preset authored copy). */
  readonly authoredUtcCadence?: string;
  readonly primaryTestId?: string;
  readonly secondaryTestId?: string;
  readonly offsetBasisTestId?: string;
  readonly className?: string;
};

/** Local-first cadence/instant lines with UTC as secondary technical detail (TB-2210). */
export function RecurrenceLocalTimeDisplay(props: RecurrenceLocalTimeDisplayProps) {
  const {
    summary,
    authoredUtcCadence,
    primaryTestId,
    secondaryTestId,
    offsetBasisTestId,
    className,
  } = props;
  // A UTC display zone leaves `utcSecondary` empty on purpose, because `localPrimary` already states
  // the cadence in UTC. The authored override must not resurrect the line there, or the same cadence
  // prints twice — once as the primary and again under the "Server schedule (UTC)" helper.
  const utcLine = summary.utcSecondary.trim().length > 0 ? (authoredUtcCadence ?? summary.utcSecondary) : "";
  const offsetBasis = summary.localOffsetBasis?.trim() ?? "";

  return (
    <div className={cn("space-y-0.5", className)}>
      <p
        className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
        data-testid={primaryTestId}
      >
        {summary.localPrimary}
      </p>
      {offsetBasis.length > 0 ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={offsetBasisTestId}
        >
          {offsetBasis}
        </p>
      ) : null}
      {utcLine.trim().length > 0 ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={secondaryTestId}
        >
          Server schedule (UTC): {utcLine}
        </p>
      ) : null}
    </div>
  );
}
