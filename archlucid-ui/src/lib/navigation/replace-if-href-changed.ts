export type PathReplaceRouter = {
  readonly replace: (href: string, options?: { readonly scroll?: boolean }) => void;
};

/** Reads the committed query string (without `?`) — not stale Next.js `useSearchParams`. */
export function readWindowLocationSearch(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const search = window.location.search;

  return search.startsWith("?") ? search.slice(1) : search;
}

function resolveCommittedHref(href: string): string {
  if (href.startsWith("/")) {
    return href;
  }

  return new URL(href, window.location.origin).pathname + new URL(href, window.location.origin).search
    + new URL(href, window.location.origin).hash;
}

/** Updates the address bar without a Next.js soft navigation (avoids remount loops). */
export function commitHrefIfChanged(nextHref: string, options?: { readonly notify?: boolean }): boolean {
  if (typeof window === "undefined" || nextHref.length === 0) {
    return false;
  }

  const committedHref = resolveCommittedHref(nextHref);
  const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (currentHref === committedHref) {
    return false;
  }

  window.history.replaceState(null, "", committedHref);

  if (options?.notify === true) {
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return true;
}

/**
 * App Router `router.replace` always refetches the current RSC route (GET / on Overview).
 * Skip when the href is already committed so searchParams identity churn cannot loop.
 */
export function replaceIfHrefChanged(router: PathReplaceRouter, nextHref: string): void {
  if (typeof window === "undefined") {
    return;
  }

  if (nextHref.length === 0) {
    return;
  }

  const currentHref = `${window.location.pathname}${window.location.search}`;

  if (currentHref === nextHref) {
    return;
  }

  router.replace(nextHref, { scroll: false });
}
