const ROUTE_REFERRER_SESSION_KEY = "archlucid.routeReferrer.v1";

export type RouteReferrerType = "nav" | "palette" | "card" | "deep-link";

/** Records how the next in-app route transition was initiated (consumed by RouteEntered). */
export function stampRouteReferrer(referrerType: Exclude<RouteReferrerType, "deep-link">): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(ROUTE_REFERRER_SESSION_KEY, referrerType);
  }
  catch {
    /* ignore */
  }
}

/** Returns and clears the pending referrer; defaults to deep-link for direct loads and external entry. */
export function consumeRouteReferrer(): RouteReferrerType {
  if (typeof window === "undefined") {
    return "deep-link";
  }

  try {
    const raw = window.sessionStorage.getItem(ROUTE_REFERRER_SESSION_KEY);
    window.sessionStorage.removeItem(ROUTE_REFERRER_SESSION_KEY);

    if (raw === "nav" || raw === "palette" || raw === "card") {
      return raw;
    }
  }
  catch {
    /* ignore */
  }

  return "deep-link";
}
