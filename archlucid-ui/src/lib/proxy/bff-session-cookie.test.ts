import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BFF_SESSION_COOKIE_NAME,
  buildBffSessionClearCookieHeader,
  buildBffSessionSetCookieHeader,
  createBffSessionCookieValue,
  isBffSessionCookieEnabled,
  resolveBffSessionBearerFromCookieValue,
  resolveBffSessionBearerFromRequest,
} from "@/lib/proxy/bff-session-cookie";

const TEST_SECRET = "test-bff-session-signing-secret";

function mockNextRequest(cookieValue: string | null): NextRequest {
  return {
    cookies: {
      get: (name: string) => (name === BFF_SESSION_COOKIE_NAME && cookieValue !== null ? { value: cookieValue } : undefined),
    },
  } as NextRequest;
}

describe("bff-session-cookie (LK-05 P1)", () => {
  beforeEach(() => {
    process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET;
    delete process.env.BFF_SESSION_SIGNING_SECRET;
    vi.useRealTimers();
  });

  it("is disabled without a signing secret", () => {
    delete process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET;

    expect(isBffSessionCookieEnabled()).toBe(false);
    expect(createBffSessionCookieValue({ accessToken: "tok", expiresAtMs: Date.now() + 60_000 })).toBeNull();
  });

  it("round-trips a signed session cookie into an upstream Bearer header", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T12:00:00.000Z"));

    const cookieValue = createBffSessionCookieValue({
      accessToken: "access-token-1",
      expiresAtMs: Date.now() + 3_600_000,
    });

    expect(cookieValue).not.toBeNull();
    expect(resolveBffSessionBearerFromCookieValue(cookieValue)).toBe("Bearer access-token-1");
    expect(resolveBffSessionBearerFromRequest(mockNextRequest(cookieValue))).toBe("Bearer access-token-1");
  });

  it("rejects expired session cookies", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T12:00:00.000Z"));

    const cookieValue = createBffSessionCookieValue({
      accessToken: "access-token-1",
      expiresAtMs: Date.now() - 1,
    });

    expect(resolveBffSessionBearerFromCookieValue(cookieValue)).toBe("");
  });

  it("builds HttpOnly Set-Cookie headers", () => {
    expect(buildBffSessionSetCookieHeader("signed-value", 3600)).toContain("HttpOnly");
    expect(buildBffSessionSetCookieHeader("signed-value", 3600)).toContain("SameSite=Lax");
    expect(buildBffSessionClearCookieHeader()).toContain(`${BFF_SESSION_COOKIE_NAME}=`);
    expect(buildBffSessionClearCookieHeader()).toContain("Max-Age=0");
  });
});
