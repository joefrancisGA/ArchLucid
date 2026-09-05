import { GOVERNANCE_RECURRENCE_SCHEDULES_PATH } from "@/lib/governance/recurrence-schedules-route";

export const RECURRENCE_SCHEDULES_CREATE_PARAM = "create";
export const RECURRENCE_SCHEDULES_EDIT_PARAM = "edit";
export const RECURRENCE_SCHEDULES_DISABLE_PARAM = "disableScheduleId";

export function parseRecurrenceSchedulesCreatePanelFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseRecurrenceSchedulesEditIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseRecurrenceSchedulesDisableIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function recurrenceSchedulesPanelsHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly showCreatePanel?: boolean;
    readonly editingId?: string | null;
    readonly disableScheduleId?: string | null;
  },
  pathname: string = GOVERNANCE_RECURRENCE_SCHEDULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.showCreatePanel !== undefined) {
    if (!patch.showCreatePanel) {
      params.delete(RECURRENCE_SCHEDULES_CREATE_PARAM);
    } else {
      params.set(RECURRENCE_SCHEDULES_CREATE_PARAM, "1");
      params.delete(RECURRENCE_SCHEDULES_EDIT_PARAM);
    }
  }

  if (patch.editingId !== undefined) {
    const trimmed = (patch.editingId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(RECURRENCE_SCHEDULES_EDIT_PARAM);
    } else {
      params.set(RECURRENCE_SCHEDULES_EDIT_PARAM, trimmed);
      params.delete(RECURRENCE_SCHEDULES_CREATE_PARAM);
    }
  }

  if (patch.disableScheduleId !== undefined) {
    const trimmed = (patch.disableScheduleId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(RECURRENCE_SCHEDULES_DISABLE_PARAM);
    } else {
      params.set(RECURRENCE_SCHEDULES_DISABLE_PARAM, trimmed);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
