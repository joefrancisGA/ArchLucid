import { formatRelativeTime } from "@/lib/relative-time";

/** Shown before the first successful load completes. */
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

/** Exact timestamp for a `title` tooltip; `undefined` keeps the attribute off the DOM. */
export function operatorLastRefreshedExactLabel(
  lastRefreshedAt: Date | null | undefined,
): string | undefined {
  if (lastRefreshedAt === null || lastRefreshedAt === undefined) {
    return undefined;
  }

  return lastRefreshedAt.toLocaleString();
}
