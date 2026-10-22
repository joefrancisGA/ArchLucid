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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 400", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 400"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 401", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 401"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 403", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 403"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 408", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 408"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 404", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 404"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 429", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 429"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 425", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 425"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 410", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 410"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 411", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 411"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 412", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 412"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 413", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 413"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 414", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 414"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 415", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 415"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 416", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 416"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 417", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 417"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 418", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 418"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 419", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 419"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 420", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 420"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 421", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 421"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 422", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 422"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 423", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 423"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 424", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 424"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 426", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 426"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 427", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 427"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 428", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 428"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 430", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 430"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 431", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 431"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 432", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 432"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 433", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 433"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 434", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 434"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 435", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 435"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 436", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 436"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 437", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 437"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 438", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 438"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 441", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 441"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 445", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 445"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 447", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 447"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 449", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 449"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 450", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 450"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 451", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 451"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 452", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 452"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 453", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 453"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 454", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 454"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 455", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 455"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 456", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 456"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 461", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 461"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 462", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 462"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 464", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 464"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 466", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 466"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 467", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 467"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 468", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 468"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 472", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 472"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 475", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 475"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 478", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 478"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 480", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 480"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 483", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 483"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 484", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 484"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 503", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 503"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 504", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 504"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws opaque token endpoint error 502", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("Token endpoint error 502"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws slow_down", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new OAuthTokenEndpointError("slow_down", "slow_down"));

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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws authorization_pending", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError("authorization_pending", "authorization_pending"),
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

  it("returns 503 without clearing BFF session cookies when refreshAccessToken throws humanized temporarily_unavailable", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(
      new OAuthTokenEndpointError(
        "Your identity provider reported a temporary error. Wait a minute and try signing in again.",
        "temporarily_unavailable",
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

  it("clears BFF session cookies when refreshAccessToken throws a legacy Error with unsupported_grant_type", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      refreshToken: "refresh-token",
      workingMode: true,
    });

    refreshAccessTokenMock.mockRejectedValue(new Error("unsupported_grant_type"));

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
