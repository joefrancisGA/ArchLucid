import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, NOTIFICATION_PREFERENCE_CENTER_RELATIONS_OPEN_PARAM);
}
