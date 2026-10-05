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
  readonly scopeHeaders?: Record<string, string>;
}): NextRequest {
  const authorization = options?.authorization ?? null;
  const bffSessionCookie = options?.bffSessionCookie ?? null;
  const headerInit: Record<string, string> = { ...(options?.scopeHeaders ?? {}) };

  if (authorization !== null) {
    headerInit.authorization = authorization;
  }

  return {
    headers: new Headers(Object.keys(headerInit).length > 0 ? headerInit : undefined),
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

  it("does not forward HttpOnly BFF session bearer on public anonymous diagnostics paths", () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "cookie-token",
      expiresAtMs: Date.now() + 3_600_000,
      workingMode: true,
    });

    const headers = buildProxyUpstreamHeaders(
      mockNextRequest({ bffSessionCookie: issueResult?.sessionCookieValue ?? null }),
      "v1/diagnostics/first-tenant-funnel",
    );

    expect(headers.get("Authorization")).toBeNull();
  });

  it("does not attach proxy host scope on public anonymous paths in production posture", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.ARCHLUCID_PROXY_TENANT_ID = "11111111-1111-1111-1111-111111111111";
    process.env.ARCHLUCID_PROXY_WORKSPACE_ID = "22222222-2222-2222-2222-222222222222";
    process.env.ARCHLUCID_PROXY_PROJECT_ID = "33333333-3333-3333-3333-333333333333";

    const headers = buildProxyUpstreamHeaders(mockNextRequest(), "v1/marketing/early-access");

    expect(headers.get("x-tenant-id")).toBeNull();
    expect(headers.get("x-workspace-id")).toBeNull();
    expect(headers.get("x-project-id")).toBeNull();

    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.ARCHLUCID_PROXY_TENANT_ID;
    delete process.env.ARCHLUCID_PROXY_WORKSPACE_ID;
    delete process.env.ARCHLUCID_PROXY_PROJECT_ID;
  });

  it("forwards browser registration scope on public anonymous funnel telemetry in production posture", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.ARCHLUCID_PROXY_TENANT_ID = "11111111-1111-1111-1111-111111111111";
    process.env.ARCHLUCID_PROXY_WORKSPACE_ID = "22222222-2222-2222-2222-222222222222";
    process.env.ARCHLUCID_PROXY_PROJECT_ID = "33333333-3333-3333-3333-333333333333";

    const headers = buildProxyUpstreamHeaders(
      mockNextRequest({
        scopeHeaders: {
          "x-tenant-id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          "x-workspace-id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          "x-project-id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        },
      }),
      "v1/diagnostics/first-tenant-funnel",
    );

    expect(headers.get("x-tenant-id")).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(headers.get("Authorization")).toBeNull();

    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.ARCHLUCID_PROXY_TENANT_ID;
    delete process.env.ARCHLUCID_PROXY_WORKSPACE_ID;
    delete process.env.ARCHLUCID_PROXY_PROJECT_ID;
  });

  it("still forwards browser Authorization on public anonymous paths when present", () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "cookie-token",
      expiresAtMs: Date.now() + 3_600_000,
      workingMode: true,
    });

    const headers = buildProxyUpstreamHeaders(
      mockNextRequest({
        authorization: "Bearer visitor-jwt",
        bffSessionCookie: issueResult?.sessionCookieValue ?? null,
      }),
      "v1/marketing/early-access",
    );

    expect(headers.get("Authorization")).toBe("Bearer visitor-jwt");
  });
});
