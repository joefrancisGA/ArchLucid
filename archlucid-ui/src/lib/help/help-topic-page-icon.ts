import { BookOpen } from "lucide-react";

/** Decorative book icon shown before in-app `/help/*` topic titles. */
export const HELP_TOPIC_PAGE_ICON = BookOpen;

export const HELP_TOPIC_PAGE_ICON_CLASS =
  "h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200";

export function isHelpTopicHref(href: string): boolean {
  const path = href.split("?")[0] ?? href;

  return path === "/help" || path.startsWith("/help/");
}
