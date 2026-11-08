import { severityBadgeLabel } from "@/lib/quick-decision-summary-derive";

const SEVERITY_LABEL_NOT_STORED = "Severity label was not stored.";

/** Maps wire severity to sponsor copy — omits the badge honesty label when severity was not stored. */
export function sponsorSeverityInputFromFindingSeverityValue(
  severityValue: number | null | undefined,
): string | null {
  const label = severityBadgeLabel(severityValue);

  return label === SEVERITY_LABEL_NOT_STORED ? null : label;
}
