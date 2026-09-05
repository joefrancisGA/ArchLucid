export type PathReplaceRouter = {
  readonly replace: (href: string, options?: { readonly scroll?: boolean }) => void;
};

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
