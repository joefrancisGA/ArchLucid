import type { TeamsNotificationCategory } from "@/lib/teams-integration-notification-catalog";
import { TEAMS_NOTIFICATION_CATEGORIES } from "@/lib/teams-integration-notification-catalog";

export const TEAMS_NOTIFICATIONS_COLLAPSED_CATEGORIES_PARAM = "teamsNotificationsCollapsedCategories";

function isTeamsNotificationCategoryId(value: string): value is TeamsNotificationCategory["id"] {
  return TEAMS_NOTIFICATION_CATEGORIES.some((category) => category.id === value);
}

export function parseTeamsNotificationsCollapsedCategoriesFromSearch(
  raw: string | null | undefined,
): readonly TeamsNotificationCategory["id"][] {
  if (raw === null || raw === undefined) {
    return [];
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return [];
  }

  return trimmed
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment): segment is TeamsNotificationCategory["id"] => isTeamsNotificationCategoryId(segment));
}

export function teamsNotificationsCollapsedCategoriesDisclosureHrefFromSearch(
  currentSearch: string,
  collapsedCategoryIds: readonly TeamsNotificationCategory["id"][],
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (collapsedCategoryIds.length === 0) {
    params.delete(TEAMS_NOTIFICATIONS_COLLAPSED_CATEGORIES_PARAM);
  } else {
    params.set(TEAMS_NOTIFICATIONS_COLLAPSED_CATEGORIES_PARAM, collapsedCategoryIds.join(","));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
