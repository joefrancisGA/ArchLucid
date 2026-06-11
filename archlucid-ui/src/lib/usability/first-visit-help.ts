import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const FIRST_VISIT_HELP_DISMISSED_PREFIX = "archlucid_first_visit_help_dismissed_v1:";

export function firstVisitHelpStorageKey(pathname: string): string {
  const path = (pathname ?? "/").split("?")[0] ?? "/";

  return `${FIRST_VISIT_HELP_DISMISSED_PREFIX}${path}`;
}

export function isFirstVisitHelpDismissed(pathname: string): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(firstVisitHelpStorageKey(pathname)) === "1";
  } catch {
    return true;
  }
}

export function dismissFirstVisitHelp(pathname: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(firstVisitHelpStorageKey(pathname), "1");
  } catch {
    /* private mode */
  }
}

export function firstVisitHelpSlugForPathname(pathname: string): string | null {
  return pageHelpTopicForPathname(pathname)?.slug ?? null;
}
