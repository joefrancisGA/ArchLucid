import { ALERTS_INBOX_ALL_STATUSES_VALUE } from "@/app/(operator)/governance/alerts/_sections/load-alerts-inbox-page-model";
import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";

export const ALERTS_INBOX_STATUS_PARAM = "status";

const ALERTS_INBOX_STATUS_CHIP_OPTIONS = [
  ALERTS_INBOX_ALL_STATUSES_VALUE,
  "Open",
  "Acknowledged",
  "Resolved",
  "Suppressed",
] as const;

export { ALERTS_INBOX_STATUS_CHIP_OPTIONS };

export type AlertsInboxStatusChipValue = (typeof ALERTS_INBOX_STATUS_CHIP_OPTIONS)[number];

export const ALERTS_INBOX_STATUS_CHIP_LABELS: Record<AlertsInboxStatusChipValue, string> = {
  [ALERTS_INBOX_ALL_STATUSES_VALUE]: "All",
  Open: "Open",
  Acknowledged: "Acknowledged",
  Resolved: "Resolved",
  Suppressed: "Suppressed",
};

export function parseAlertsInboxStatusFromSearch(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Open";
  }

  if ((ALERTS_INBOX_STATUS_CHIP_OPTIONS as readonly string[]).includes(trimmed)) {
    return trimmed;
  }

  return "Open";
}

export function alertsInboxStatusHrefFromSearch(currentSearch: string, status: string): string {
  const params = new URLSearchParams(currentSearch);
  params.delete("cursor");

  if (status === "Open") {
    params.delete(ALERTS_INBOX_STATUS_PARAM);
  } else {
    params.set(ALERTS_INBOX_STATUS_PARAM, status);
  }

  const query = params.toString();

  return query.length === 0 ? GOVERNANCE_ALERTS_PATH : `${GOVERNANCE_ALERTS_PATH}?${query}`;
}
