import { navHrefPathPart } from "@/lib/nav-href-path-part";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/**
 * Public marketing route prefixes on the shared Next.js host.
 * SecureNow deployments must not serve these — redirect to the operator home.
 */
export const SECURENOW_BLOCKED_MARKETING_ROUTE_PREFIXES: readonly string[] = [
  "/welcome",
  "/quick-scan",
  "/faq",
  "/why",
  "/privacy",
  "/get-started",
  "/pricing",
  "/see-it",
  "/signup",
  "/digest",
  "/accessibility",
  "/compliance-journey",
  "/trust",
  "/showcase",
  "/assurance-status",
  "/demo",
  "/quick-start",
] as const;

/** Exact path for the noindex SecureNow draft page (not matched by the `/why` prefix). */
export const SECURENOW_DRAFT_MARKETING_PATH = "/why-securenow" as const;

/** Set by `proxy.ts` on pass-through requests for marketing layout routing. */
export const ARCHLUCID_PATHNAME_REQUEST_HEADER = "x-archlucid-pathname" as const;

export function normalizeMarketingRoutePath(pathnameOrHref: string): string {
  const pathname = navHrefPathPart(pathnameOrHref);

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function isMarketingRoutePath(pathnameOrHref: string): boolean {
  const pathname = normalizeMarketingRoutePath(pathnameOrHref);

  return SECURENOW_BLOCKED_MARKETING_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isMarketingRouteBlockedForProductLine(productLineId: ProductLineId): boolean {
  return productLineId === "security";
}

export function isSecureNowDraftMarketingPath(pathnameOrHref: string): boolean {
  return normalizeMarketingRoutePath(pathnameOrHref) === SECURENOW_DRAFT_MARKETING_PATH;
}

export function shouldRedirectMarketingLayout(args: {
  readonly productLineId: ProductLineId;
  readonly pathname: string;
}): boolean {
  if (!isMarketingRouteBlockedForProductLine(args.productLineId)) {
    return false;
  }

  return !isSecureNowDraftMarketingPath(args.pathname);
}

export function secureNowMarketingRedirectPath(): string {
  return "/";
}
