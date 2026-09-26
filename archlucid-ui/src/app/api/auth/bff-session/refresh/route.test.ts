import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/auth/bff-session/refresh/route";
import {
  BFF_SESSION_COOKIE_NAME,
  createBffSessionCookieValue,
} from "@/lib/proxy/bff-session-cookie";
import { BFF_CSRF_HEADER } from "@/lib/proxy/bff-session-constants";

const refreshAccessTokenMock = vi.fn();
const loadDiscoveryDocumentMock = vi.fn();

vi.mock("@/lib/oidc/config", () => ({
  getOidcAuthority: () => "https://login.example.com",
  getOidcClientId: () => "archlucid-ui",
}));

vi.mock("@/lib/oidc/discovery", () => ({
  loadDiscoveryDocument: (...args: unknown[]) => loadDiscoveryDocumentMock(...args),
}));

vi.mock("@/lib/oidc/token-client", () => ({
  refreshAccessToken: (...args: unknown[]) => refreshAccessTokenMock(...args),
}));

describe("POST /api/auth/bff-session/refresh", () => {
  beforeEach(() => {
    process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET = "bff-refresh-route-test-secret";
    loadDiscoveryDocumentMock.mockResolvedValue({
      token_endpoint: "https://login.example.com/oauth2/token",
    });
  });

  afterEach(() => {
    delete process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("clears BFF session cookies when the session has no refresh token", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      workingMode: true,
    });

    const req = new NextRequest("http://localhost/api/auth/bff-session/refresh", {
      method: "POST",
      headers: {
        cookie: `${BFF_SESSION_COOKIE_NAME}=${issueResult?.sessionCookieValue ?? ""}`,
        [BFF_CSRF_HEADER]: issueResult?.csrfToken ?? "",
      },
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("archlucid-bff-session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("clears BFF session cookies when the session cookie is expired", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T12:00:00.000Z"));

    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    vi.setSystemTime(new Date("2026-09-07T12:00:00.000Z"));

    const req = new NextRequest("http://localhost/api/auth/bff-session/refresh", {
      method: "POST",
      headers: {
        cookie: `${BFF_SESSION_COOKIE_NAME}=${issueResult?.sessionCookieValue ?? ""}`,
        [BFF_CSRF_HEADER]: issueResult?.csrfToken ?? "",
      },
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("archlucid-bff-session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("clears BFF session cookies when the refresh token is rejected", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("token endpoint error 400: invalid_grant"));

    const req = new NextRequest("http://localhost/api/auth/bff-session/refresh", {
      method: "POST",
      headers: {
        cookie: `${BFF_SESSION_COOKIE_NAME}=${issueResult?.sessionCookieValue ?? ""}`,
        [BFF_CSRF_HEADER]: issueResult?.csrfToken ?? "",
      },
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("archlucid-bff-session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
