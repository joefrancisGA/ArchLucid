import { formatInstantForLocale } from "@/lib/locale-datetime";
import { formatRelativeTime } from "@/lib/relative-time";

/** Shown before the first successful load completes (TB-2111 — shared across operator headers). */
export const OPERATOR_NOT_REFRESHED_LABEL = "Not refreshed yet" as const;

/**
 * Visible freshness label for operator page headers. Relative age keeps second-precision
 * locale timestamps — machine detail on buyer-facing surfaces — out of the header line.
 */
export function operatorLastRefreshedLabel(lastRefreshedAt: Date | null | undefined): string {
  if (lastRefreshedAt === null || lastRefreshedAt === undefined) {
    return OPERATOR_NOT_REFRESHED_LABEL;
  }

  return formatRelativeTime(lastRefreshedAt.toISOString());
}

export type OperatorFreshnessMetadataArgs = {
  /** Header prefix used only when there is a timestamp to qualify, e.g. "Last refreshed". */
  readonly prefix: string;
  readonly lastRefreshedAt: Date | null | undefined;
  /** Copy shown while a refresh is in flight; `null` when idle. */
  readonly refreshingLabel: string | null;
};

/**
 * Freshness line for an operator page header. Before the first refresh there is no timestamp
 * for the prefix to qualify, so the bare state is returned — "Last refreshed: Not refreshed yet"
 * reads as a broken timestamp rather than an honest empty state.
 */
export function operatorFreshnessMetadataLabel(args: OperatorFreshnessMetadataArgs): string {
  if (args.refreshingLabel !== null) {
    return args.refreshingLabel;
  }

  if (args.lastRefreshedAt === null || args.lastRefreshedAt === undefined) {
    return OPERATOR_NOT_REFRESHED_LABEL;
  }

  return `${args.prefix}: ${operatorLastRefreshedLabel(args.lastRefreshedAt)}`;
}

/**
 * Freshness metadata with a visible clock parenthetical so operators do not rely on a
 * mouse-only `title` tooltip for the absolute timestamp (TB-2147).
 */
export function operatorFreshnessMetadataWithClockLabel(
  args: OperatorFreshnessMetadataArgs,
): string {
  if (args.refreshingLabel !== null) {
    return args.refreshingLabel;
  }

  if (args.lastRefreshedAt === null || args.lastRefreshedAt === undefined) {
    return OPERATOR_NOT_REFRESHED_LABEL;
  }

  return `${args.prefix}: ${operatorFreshnessMetadataClockValue(args.lastRefreshedAt)}`;
}

/**
 * Clock-qualified freshness value without the header prefix.
 * Drops the locale “now” relative when a clock is visible — the timestamp already says that.
 */
export function operatorFreshnessMetadataClockValue(lastRefreshedAt: Date): string {
  const clockLabel = operatorLastRefreshedClockLabel(lastRefreshedAt);
  const relativeLabel = operatorLastRefreshedLabel(lastRefreshedAt);

  if (clockLabel === null) {
    return relativeLabel;
  }

  const nowMs = Date.now();
  const nowRelativeLabel = formatRelativeTime(new Date(nowMs).toISOString(), nowMs);

  if (relativeLabel === nowRelativeLabel) {
    return clockLabel;
  }

  return `${relativeLabel} (${clockLabel})`;
}

/** Exact locale timestamp string for visible clock parentheticals and `<time>` labels. */
export function operatorLastRefreshedExactLabel(
  lastRefreshedAt: Date | null | undefined,
): string | undefined {
  if (lastRefreshedAt === null || lastRefreshedAt === undefined) {
    return undefined;
  }

  return formatInstantForLocale(lastRefreshedAt.toISOString());
}

/**
 * Clock time with timezone for health surfaces. A relative age alone goes stale silently,
 * and operators correlating health with an incident timeline need an absolute reading.
 */
export function operatorLastRefreshedClockLabel(
  lastRefreshedAt: Date | null | undefined,
): string | null {
  if (lastRefreshedAt === null || lastRefreshedAt === undefined) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(lastRefreshedAt);
}
