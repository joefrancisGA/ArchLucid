import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/auth/bff-session/refresh/route";
import { OAuthTokenEndpointError } from "@/lib/oidc/token-client";
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

vi.mock("@/lib/oidc/token-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/oidc/token-client")>();

  return {
    ...actual,
    refreshAccessToken: (...args: unknown[]) => refreshAccessTokenMock(...args),
  };
});

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws humanized server_error", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "Your identity provider reported a temporary error. Wait a minute and try signing in again.",
        "server_error",
      ),
    );

    const req = new NextRequest("http://localhost/api/auth/bff-session/refresh", {
      method: "POST",
      headers: {
        cookie: `${BFF_SESSION_COOKIE_NAME}=${issueResult?.sessionCookieValue ?? ""}`,
        [BFF_CSRF_HEADER]: issueResult?.csrfToken ?? "",
      },
    });

    const response = await POST(req);

    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("clears BFF session cookies when refreshAccessToken throws humanized unauthorized_client", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "This sign-in route is not enabled for your identity provider registration. Contact your ArchLucid account team.",
        "unauthorized_client",
      ),
    );

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

  it("clears BFF session cookies when refreshAccessToken throws humanized invalid_client", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "Sign-in did not finish (invalid client). Try again, or contact support if this persists.",
        "invalid_client",
      ),
    );

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

  it("clears BFF session cookies when refreshAccessToken throws humanized invalid_grant", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "Sign-in did not finish (invalid grant). Try again, or contact support if this persists.",
        "invalid_grant",
      ),
    );

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

  it("clears BFF session cookies when refreshAccessToken throws humanized access_denied", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "You canceled sign-in or your organization declined access. Try again if that was unintentional.",
        "access_denied",
      ),
    );

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

  it("clears BFF session cookies when refreshAccessToken throws humanized expired_token", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "Sign-in did not finish (expired token). Try again, or contact support if this persists.",
        "expired_token",
      ),
    );

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

  it("clears BFF session cookies when refreshAccessToken throws humanized invalid_request", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "This sign-in request was not valid. Try signing in again.",
        "invalid_request",
      ),
    );

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

  it("clears BFF session cookies when refreshAccessToken throws non-humanized unsupported_grant_type", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError("unsupported_grant_type", "unsupported_grant_type"),
    );

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

  it("clears BFF session cookies when refreshAccessToken throws humanized login_required", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "Another sign-in step is required. Try signing in again and complete any prompts from your identity provider.",
        "login_required",
      ),
    );

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

  it("clears BFF session cookies when refreshAccessToken throws description-only OAuth JSON", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError("Refresh token was revoked", "invalid_request"),
    );

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

  it("clears BFF session cookies when refreshAccessToken throws humanized access_denied", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "You canceled sign-in or your organization declined access. Try again if that was unintentional.",
        "access_denied",
      ),
    );

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

  it("clears BFF session cookies when refreshAccessToken throws humanized invalid_scope", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "The requested permissions are not available on this tenant. Contact your ArchLucid account team.",
        "invalid_scope",
      ),
    );

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

  it("clears BFF session cookies when refreshAccessToken throws humanized unauthorized_client", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "This sign-in route is not enabled for your identity provider registration. Contact your ArchLucid account team.",
        "unauthorized_client",
      ),
    );

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
