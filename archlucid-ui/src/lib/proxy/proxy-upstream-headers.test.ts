import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BFF_SESSION_COOKIE_NAME,
  createBffSessionCookieValue,
} from "@/lib/proxy/bff-session-cookie";
import { PRODUCT_LINE_UPSTREAM_HEADER } from "@/lib/product-line/product-line-http-header";
import { buildProxyUpstreamHeaders } from "@/lib/proxy/proxy-upstream-headers";

function mockNextRequest(options?: {
  readonly authorization?: string | null;
  readonly bffSessionCookie?: string | null;
}): NextRequest {
  const authorization = options?.authorization ?? null;
  const bffSessionCookie = options?.bffSessionCookie ?? null;

  return {
    headers: new Headers(authorization !== null ? { authorization } : undefined),
    cookies: {
      get: (name: string) => {
        if (name === BFF_SESSION_COOKIE_NAME && bffSessionCookie !== null) {
          return { value: bffSessionCookie };
        }

        return undefined;
      },
    },
  } as NextRequest;
}

describe("buildProxyUpstreamHeaders product line (OP-03)", () => {
  const originalProductEnv = process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT;

  afterEach(() => {
    if (originalProductEnv === undefined) {
      delete process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT;
    } else {
      process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT = originalProductEnv;
    }
  });

  it("forwards security header when SecureNow build env is active", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT = "security";

    const headers = buildProxyUpstreamHeaders(mockNextRequest(), "v1/findings");

    expect(headers.get(PRODUCT_LINE_UPSTREAM_HEADER)).toBe("security");
  });

  it("omits product-line header for Architecture build env", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_PRODUCT = "architecture";

    const headers = buildProxyUpstreamHeaders(mockNextRequest(), "v1/findings");

    expect(headers.get(PRODUCT_LINE_UPSTREAM_HEADER)).toBeNull();
  });
});

describe("buildProxyUpstreamHeaders BFF session (LK-05 P1 / LK-06 P2)", () => {
  beforeEach(() => {
    process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET = "proxy-header-test-secret";
  });

  afterEach(() => {
    delete process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET;
    delete process.env.ARCHLUCID_PROXY_BEARER_TOKEN;
  });

  it("prefers the HttpOnly BFF session cookie over browser Authorization (LK-06 P2)", () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "cookie-token",
      expiresAtMs: Date.now() + 3_600_000,
      workingMode: true,
    });

    const headers = buildProxyUpstreamHeaders(
      mockNextRequest({
        authorization: "Bearer header-token",
        bffSessionCookie: issueResult?.sessionCookieValue ?? null,
      }),
      "v1/authority/reviews/run-1",
    );

    expect(headers.get("Authorization")).toBe("Bearer cookie-token");
  });

  it("forwards upstream Bearer from the HttpOnly BFF session cookie when Authorization is absent", () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "cookie-token",
      expiresAtMs: Date.now() + 3_600_000,
      workingMode: true,
    });

    const headers = buildProxyUpstreamHeaders(
      mockNextRequest({ bffSessionCookie: issueResult?.sessionCookieValue ?? null }),
      "v1/authority/reviews/run-1",
    );

    expect(headers.get("Authorization")).toBe("Bearer cookie-token");
  });
});
