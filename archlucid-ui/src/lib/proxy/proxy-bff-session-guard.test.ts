import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SESSION_IDLE_WORKING_TIMEOUT_MS } from "@/lib/auth/session-idle-timeout";
import { BFF_CSRF_HEADER } from "@/lib/proxy/bff-session-constants";
import {
  BFF_SESSION_COOKIE_NAME,
  createBffSessionCookieValue,
} from "@/lib/proxy/bff-session-cookie";
import { enforceProxyBffSessionGuard } from "@/lib/proxy/proxy-bff-session-guard";

const TEST_SECRET = "proxy-bff-guard-test-secret";
const ORIGIN = "http://localhost:3000";

function mockNextRequest(options?: {
  readonly method?: string;
  readonly cookieValue?: string | null;
  readonly csrfHeader?: string | null;
  readonly origin?: string | null;
  readonly authorization?: string | null;
}): NextRequest {
  const headers = new Headers();

  if (options?.csrfHeader) {
    headers.set(BFF_CSRF_HEADER, options.csrfHeader);
  }

  if (options?.origin) {
    headers.set("origin", options.origin);
  }

  if (options?.authorization) {
    headers.set("authorization", options.authorization);
  }

  return {
    headers,
    cookies: {
      get: (name: string) => {
        if (name === BFF_SESSION_COOKIE_NAME && options?.cookieValue) {
          return { value: options.cookieValue };
        }

        return undefined;
      },
    },
    nextUrl: new URL(ORIGIN),
  } as NextRequest;
}

describe("enforceProxyBffSessionGuard (LK-07)", () => {
  beforeEach(() => {
    process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET = TEST_SECRET;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T12:00:00.000Z"));
  });

  afterEach(() => {
    delete process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET;
    vi.useRealTimers();
  });

  it("rejects mutating proxy calls without a BFF session cookie", () => {
    const result = enforceProxyBffSessionGuard(mockNextRequest({ method: "POST" }), "POST", "corr-1");

    expect(result.allowed).toBe(false);

    if (!result.allowed) {
      expect(result.response.status).toBe(401);
    }
  });

  it("rejects mutating proxy calls without a CSRF token", () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      workingMode: true,
    });

    const result = enforceProxyBffSessionGuard(
      mockNextRequest({
        method: "POST",
        cookieValue: issueResult?.sessionCookieValue ?? null,
        origin: ORIGIN,
      }),
      "POST",
      "corr-2",
    );

    expect(result.allowed).toBe(false);

    if (!result.allowed) {
      expect(result.response.status).toBe(403);
    }
  });

  it("rejects forged cross-origin mutations even with a CSRF header", () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      workingMode: true,
    });

    const result = enforceProxyBffSessionGuard(
      mockNextRequest({
        method: "POST",
        cookieValue: issueResult?.sessionCookieValue ?? null,
        csrfHeader: issueResult?.csrfToken ?? null,
        origin: "https://evil.example",
      }),
      "POST",
      "corr-3",
    );

    expect(result.allowed).toBe(false);

    if (!result.allowed) {
      expect(result.response.status).toBe(403);
    }
  });

  it("allows same-origin mutations with a valid session and CSRF token", () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      workingMode: true,
    });

    const result = enforceProxyBffSessionGuard(
      mockNextRequest({
        method: "POST",
        cookieValue: issueResult?.sessionCookieValue ?? null,
        csrfHeader: issueResult?.csrfToken ?? null,
        origin: ORIGIN,
      }),
      "POST",
      "corr-4",
    );

    expect(result.allowed).toBe(true);

    if (result.allowed) {
      expect(result.slideCookieHeaders.length).toBeGreaterThan(0);
    }
  });

  it("rejects idle-expired Working sessions on mutations", () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      lastActivityAtMs: Date.now() - SESSION_IDLE_WORKING_TIMEOUT_MS,
      workingMode: true,
    });

    const result = enforceProxyBffSessionGuard(
      mockNextRequest({
        method: "POST",
        cookieValue: issueResult?.sessionCookieValue ?? null,
        csrfHeader: issueResult?.csrfToken ?? null,
        origin: ORIGIN,
      }),
      "POST",
      "corr-5",
    );

    expect(result.allowed).toBe(false);

    if (!result.allowed) {
      expect(result.response.status).toBe(401);
    }
  });
});
