import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BFF_SESSION_COOKIE_NAME,
  createBffSessionCookieValue,
} from "@/lib/proxy/bff-session-cookie";
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

describe("buildProxyUpstreamHeaders BFF dual-mode (LK-05 P1)", () => {
  beforeEach(() => {
    process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET = "proxy-header-test-secret";
  });

  afterEach(() => {
    delete process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET;
    delete process.env.ARCHLUCID_PROXY_BEARER_TOKEN;
  });

  it("prefers browser Authorization over the BFF session cookie", () => {
    const cookieValue = createBffSessionCookieValue({
      accessToken: "cookie-token",
      expiresAtMs: Date.now() + 3_600_000,
    });

    const headers = buildProxyUpstreamHeaders(
      mockNextRequest({
        authorization: "Bearer header-token",
        bffSessionCookie: cookieValue,
      }),
      "v1/authority/reviews/run-1",
    );

    expect(headers.get("Authorization")).toBe("Bearer header-token");
  });

  it("forwards upstream Bearer from the HttpOnly BFF session cookie when Authorization is absent", () => {
    const cookieValue = createBffSessionCookieValue({
      accessToken: "cookie-token",
      expiresAtMs: Date.now() + 3_600_000,
    });

    const headers = buildProxyUpstreamHeaders(
      mockNextRequest({ bffSessionCookie: cookieValue }),
      "v1/authority/reviews/run-1",
    );

    expect(headers.get("Authorization")).toBe("Bearer cookie-token");
  });
});
