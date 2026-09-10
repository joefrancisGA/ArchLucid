import { LIVELIHOOD_DOCUMENT_GUARD_OPEN_PARAM } from "@/lib/operator/livelihood-document-guard-url";

export function isSameDocumentPath(href: string): boolean {
  const current = `${window.location.pathname}${window.location.search}`;

  return href === current;
}

export function isInternalAppHref(href: string): boolean {
  if (!href.startsWith("/")) {
    return false;
  }

  if (href.startsWith("//")) {
    return false;
  }

  return true;
}

function normalizeHrefToPathAndSearch(href: string): string {
  if (href.startsWith("/")) {
    return href;
  }

  const url = new URL(href, window.location.origin);

  return `${url.pathname}${url.search}`;
}

function isSamePathnameNavigation(href: string): boolean {
  const targetPath = normalizeHrefToPathAndSearch(href).split("?")[0] ?? "";

  return targetPath === window.location.pathname;
}

/** Allows the guard dialog to sync `navGuardOpen` without treating it as a leave attempt. */
export function isNavGuardOpenOnlySync(href: string): boolean {
  const targetPathAndSearch = normalizeHrefToPathAndSearch(href);
  const currentPathAndSearch = `${window.location.pathname}${window.location.search}`;

  if (targetPathAndSearch === currentPathAndSearch) {
    return true;
  }

  const targetUrl = new URL(targetPathAndSearch, window.location.origin);
  const currentUrl = new URL(currentPathAndSearch, window.location.origin);

  if (targetUrl.pathname !== currentUrl.pathname) {
    return false;
  }

  const currentParams = new URLSearchParams(currentUrl.search);
  const targetParams = new URLSearchParams(targetUrl.search);
  const currentWithoutGuard = new URLSearchParams(currentParams);
  const targetWithoutGuard = new URLSearchParams(targetParams);

  currentWithoutGuard.delete(LIVELIHOOD_DOCUMENT_GUARD_OPEN_PARAM);
  targetWithoutGuard.delete(LIVELIHOOD_DOCUMENT_GUARD_OPEN_PARAM);

  return currentWithoutGuard.toString() === targetWithoutGuard.toString();
}

/** Programmatic navigations that should not open the leave dialog (LW-076). */
export function isAllowedProgrammaticNavigation(href: string): boolean {
  if (!isInternalAppHref(href)) {
    return true;
  }

  if (href.startsWith("#")) {
    return true;
  }

  if (isSameDocumentPath(href)) {
    return true;
  }

  if (isNavGuardOpenOnlySync(href)) {
    return true;
  }

  if (isSamePathnameNavigation(href)) {
    return true;
  }

  return false;
}
