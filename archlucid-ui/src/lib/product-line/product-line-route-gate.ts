import type { NextRequest } from "next/server";

import { isPathAllowedForProductLine } from "@/lib/product-line/product-line-path-access";
import { isProductLineId, type ProductLineId } from "@/lib/product-line/product-line-id";
import { PRODUCT_LINE_COOKIE } from "@/lib/product-line/product-line-storage";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

export type ProductLineRouteRedirectDecision =
  | { readonly kind: "allow" }
  | { readonly kind: "redirect"; readonly location: string };

/** Operator home for blocked cross-product deep links (matches ProductLineRouteGate). */
export const PRODUCT_LINE_ROUTE_GATE_REDIRECT_PATH = "/" as const;

const PRODUCT_LINE_ROUTE_GATE_SKIP_PREFIXES: readonly string[] = ["/api/", "/_next/"];

export function shouldSkipProductLineRouteGate(pathname: string): boolean {
  if (pathname === "/403") {
    return true;
  }

  return PRODUCT_LINE_ROUTE_GATE_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function resolveProductLineIdFromRequest(request: NextRequest): ProductLineId {
  const raw = request.cookies.get(PRODUCT_LINE_COOKIE)?.value?.trim().toLowerCase() ?? "";

  if (isProductLineId(raw)) {
    return raw;
  }

  return resolveProductLineIdFromEnv();
}

export function decideProductLineRouteRedirect(input: {
  readonly pathname: string;
  readonly productLine: ProductLineId;
}): ProductLineRouteRedirectDecision {
  if (shouldSkipProductLineRouteGate(input.pathname)) {
    return { kind: "allow" };
  }

  if (isPathAllowedForProductLine(input.pathname, input.productLine)) {
    return { kind: "allow" };
  }

  return { kind: "redirect", location: PRODUCT_LINE_ROUTE_GATE_REDIRECT_PATH };
}
