export const NOTIFICATION_PREFERENCE_CENTER_RELATIONS_OPEN_PARAM = "notificationPreferenceCenterRelationsOpen";

export function parseNotificationPreferenceCenterRelationsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function notificationPreferenceCenterRelationsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(NOTIFICATION_PREFERENCE_CENTER_RELATIONS_OPEN_PARAM);
  } else {
    params.set(NOTIFICATION_PREFERENCE_CENTER_RELATIONS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
