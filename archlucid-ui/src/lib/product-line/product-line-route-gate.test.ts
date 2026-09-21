import { describe, expect, it, vi } from "vitest";

import {
  decideProductLineRouteRedirect,
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

  it("blocks Architecture-only operator paths in the Security product without home redirect", () => {
    expect(
      decideProductLineRouteRedirect({
        pathname: "/architecture/reviews",
        productLine: "security",
      }),
    ).toEqual({ kind: "blocked", pathname: "/architecture/reviews" });

    expect(
      decideProductLineRouteRedirect({
        pathname: "/insights/evidence-graph",
        productLine: "security",
      }),
    ).toEqual({ kind: "blocked", pathname: "/insights/evidence-graph" });
  });

  it("blocks SecureNow remediation factory in the Architecture shell", () => {
    expect(
      decideProductLineRouteRedirect({
        pathname: "/security/remediation-factory",
        productLine: "architecture",
      }),
    ).toEqual({ kind: "blocked", pathname: "/security/remediation-factory" });
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
