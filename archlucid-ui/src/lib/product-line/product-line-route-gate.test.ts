import { describe, expect, it, vi } from "vitest";

import {
  decideProductLineRouteRedirect,
  PRODUCT_LINE_ROUTE_GATE_REDIRECT_PATH,
  resolveProductLineIdFromRequest,
  shouldSkipProductLineRouteGate,
} from "@/lib/product-line/product-line-route-gate";

describe("product-line-route-gate", () => {
  it("allows shared infrastructure paths in the Security product", () => {
    expect(
      decideProductLineRouteRedirect({
        pathname: "/infrastructure/resources/res-1",
        productLine: "security",
      }),
    ).toEqual({ kind: "allow" });
  });

  it("redirects Architecture-only operator paths in the Security product", () => {
    expect(
      decideProductLineRouteRedirect({
        pathname: "/architecture/reviews",
        productLine: "security",
      }),
    ).toEqual({ kind: "redirect", location: PRODUCT_LINE_ROUTE_GATE_REDIRECT_PATH });

    expect(
      decideProductLineRouteRedirect({
        pathname: "/insights/evidence-graph",
        productLine: "security",
      }),
    ).toEqual({ kind: "redirect", location: PRODUCT_LINE_ROUTE_GATE_REDIRECT_PATH });
  });

  it("skips API and framework paths", () => {
    expect(shouldSkipProductLineRouteGate("/api/proxy/v1/architectures")).toBe(true);
    expect(shouldSkipProductLineRouteGate("/_next/static/chunk.js")).toBe(true);
    expect(
      decideProductLineRouteRedirect({
        pathname: "/api/proxy/v1/architectures",
        productLine: "security",
      }),
    ).toEqual({ kind: "allow" });
  });

  it("reads the product-line cookie from the request before build env", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_PRODUCT", "architecture");

    const request = {
      cookies: {
        get: (name: string) =>
          name === "archlucid_product_line_v1" ? { value: "security" } : undefined,
      },
    } as Parameters<typeof resolveProductLineIdFromRequest>[0];

    expect(resolveProductLineIdFromRequest(request)).toBe("security");

    vi.unstubAllEnvs();
  });
});
