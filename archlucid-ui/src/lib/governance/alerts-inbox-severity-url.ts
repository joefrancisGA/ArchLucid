import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";

export const ALERTS_INBOX_SEVERITY_PARAM = "severity";

export const ALERTS_INBOX_SEVERITY_CHIP_OPTIONS = [
  "Critical",
  "High",
  "Medium",
  "Warning",
] as const;

export type AlertsInboxSeverityChipValue = (typeof ALERTS_INBOX_SEVERITY_CHIP_OPTIONS)[number];

const ALERTS_INBOX_SEVERITY_IDS = new Set<string>(ALERTS_INBOX_SEVERITY_CHIP_OPTIONS);

export function parseAlertsInboxSeverityFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  const trimmed = raw.trim();

  if (!ALERTS_INBOX_SEVERITY_IDS.has(trimmed)) {
    return "";
  }

  return trimmed;
}

export function alertsInboxSeverityHrefFromSearch(currentSearch: string, severity: string): string {
  const params = new URLSearchParams(currentSearch);
  params.delete("cursor");
  const trimmed = severity.trim();

  if (trimmed.length === 0) {
    params.delete(ALERTS_INBOX_SEVERITY_PARAM);
  } else {
    params.set(ALERTS_INBOX_SEVERITY_PARAM, trimmed);
  }

  const query = params.toString();

  return query.length === 0 ? GOVERNANCE_ALERTS_PATH : `${GOVERNANCE_ALERTS_PATH}?${query}`;
}
