import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./[...path]/route";
import {
  BFF_SESSION_COOKIE_NAME,
  createBffSessionCookieValue,
} from "@/lib/proxy/bff-session-cookie";
import { resetProxyRateLimitStateForTests } from "@/lib/proxy-rate-limit";

describe("proxy route pre-auth anonymous paths", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetProxyRateLimitStateForTests();
    vi.stubEnv("ARCHLUCID_PROXY_BEARER_TOKEN", "configured-proxy-bearer");
    fetchMock.mockResolvedValue(
      new Response('{"allowEmailCode":true,"ssoRequired":false}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("forwards sign-in routing evaluate POST when BFF session cookie is expired", async () => {
    vi.stubEnv("ARCHLUCID_BFF_SESSION_SIGNING_SECRET", "pre-auth-routing-bff-secret");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T12:00:00.000Z"));

    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      workingMode: true,
    });

    vi.setSystemTime(new Date("2026-09-07T12:00:00.000Z"));

    const req = new NextRequest("http://localhost/api/proxy/v1/auth/routing/evaluate", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
        "content-length": "28",
        cookie: `${BFF_SESSION_COOKIE_NAME}=${issueResult?.sessionCookieValue ?? ""}`,
      },
      body: '{"email":"user@example.com"}',
    });

    const res = await POST(req, {
      params: Promise.resolve({ path: ["v1", "auth", "routing", "evaluate"] }),
    });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get("authorization")).toBeNull();

    vi.useRealTimers();
  });

  it("forwards invitation validate GET when BFF session cookie is idle-expired", async () => {
    vi.stubEnv("ARCHLUCID_BFF_SESSION_SIGNING_SECRET", "pre-auth-invite-bff-secret");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T12:00:00.000Z"));

    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      lastActivityAtMs: Date.now() - 4 * 60 * 60 * 1000 - 1,
      workingMode: true,
    });

    fetchMock.mockResolvedValue(
      new Response('{"valid":false}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const req = new NextRequest(
      "http://localhost/api/proxy/v1/auth/invitations/validate?token=abc",
      {
        headers: {
          cookie: `${BFF_SESSION_COOKIE_NAME}=${issueResult?.sessionCookieValue ?? ""}`,
        },
      },
    );

    const res = await GET(req, {
      params: Promise.resolve({ path: ["v1", "auth", "invitations", "validate"] }),
    });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get("authorization")).toBeNull();

    vi.useRealTimers();
  });
});
