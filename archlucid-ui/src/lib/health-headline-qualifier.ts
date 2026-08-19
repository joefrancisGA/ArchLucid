import type { HealthExceptionRow } from "@/lib/health-readiness-exceptions";

export type HealthHeadlineQualifier = {
  /** Sentence appended to the overall-status hero; `null` when nothing qualifies the headline. */
  readonly text: string | null;
  readonly attentionCount: number;
  readonly notConfiguredCount: number;
};

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * Keeps the hero honest: "All required services are healthy" must not stand alone while a
 * dependency below reports Not configured or Degraded.
 */
export function buildHealthHeadlineQualifier(
  exceptions: readonly HealthExceptionRow[],
): HealthHeadlineQualifier {
  const notConfiguredCount = exceptions.filter(
    (exception) => exception.row.severity === "not-configured",
  ).length;
  const attentionCount = exceptions.length - notConfiguredCount;
  const parts: string[] = [];

  if (attentionCount > 0) {
    parts.push(`${attentionCount} ${pluralize(attentionCount, "check needs", "checks need")} attention`);
  }

  if (notConfiguredCount > 0) {
    parts.push(
      `${notConfiguredCount} optional ${pluralize(notConfiguredCount, "dependency is", "dependencies are")} not configured`,
    );
  }

  return {
    text: parts.length > 0 ? parts.join(" · ") : null,
    attentionCount,
    notConfiguredCount,
  };
}
