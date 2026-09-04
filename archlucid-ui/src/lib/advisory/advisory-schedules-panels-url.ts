import { GOVERNANCE_ADVISORY_SCANS_PATH } from "@/lib/governance/governance-route-paths";

export const ADVISORY_SCHEDULES_CREATE_PARAM = "create";
export const ADVISORY_SCHEDULES_HISTORY_PARAM = "history";

export function parseAdvisorySchedulesCreatePanelFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseAdvisorySchedulesHistoryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function advisorySchedulesPanelsHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly showCreatePanel?: boolean;
    readonly historyScheduleId?: string | null;
  },
  pathname: string = GOVERNANCE_ADVISORY_SCANS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.showCreatePanel !== undefined) {
    if (!patch.showCreatePanel) {
      params.delete(ADVISORY_SCHEDULES_CREATE_PARAM);
    } else {
      params.set(ADVISORY_SCHEDULES_CREATE_PARAM, "1");
    }
  }

  if (patch.historyScheduleId !== undefined) {
    const trimmed = (patch.historyScheduleId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(ADVISORY_SCHEDULES_HISTORY_PARAM);
    } else {
      params.set(ADVISORY_SCHEDULES_HISTORY_PARAM, trimmed);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
