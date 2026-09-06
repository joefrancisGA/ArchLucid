export const NOTIFICATION_PREFERENCE_RELATIONS_OPEN_PARAM = "notificationPreferenceRelationsOpen";

export function parseNotificationPreferenceRelationsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function notificationPreferenceRelationsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(NOTIFICATION_PREFERENCE_RELATIONS_OPEN_PARAM);
  } else {
    params.set(NOTIFICATION_PREFERENCE_RELATIONS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
