import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/auth/bff-session/activity/route";
import {
  BFF_SESSION_COOKIE_NAME,
  createBffSessionCookieValue,
} from "@/lib/proxy/bff-session-cookie";
import { BFF_CSRF_HEADER } from "@/lib/proxy/bff-session-constants";

describe("POST /api/auth/bff-session/activity", () => {
  beforeEach(() => {
    process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET = "bff-activity-route-test-secret";
  });

  afterEach(() => {
    delete process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET;
    vi.useRealTimers();
  });

  it("clears BFF session cookies when the session cookie cannot be parsed", async () => {
    const req = new NextRequest("http://localhost/api/auth/bff-session/activity", {
      method: "POST",
      headers: {
        cookie: `${BFF_SESSION_COOKIE_NAME}=not-a-valid-signed-cookie`,
        [BFF_CSRF_HEADER]: "csrf-token",
        "content-type": "application/json",
      },
      body: "{}",
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("archlucid-bff-session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("clears BFF session cookies when the session is past absolute expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T12:00:00.000Z"));

    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      workingMode: true,
    });

    vi.setSystemTime(new Date("2026-09-07T12:00:00.000Z"));

    const req = new NextRequest("http://localhost/api/auth/bff-session/activity", {
      method: "POST",
      headers: {
        cookie: `${BFF_SESSION_COOKIE_NAME}=${issueResult?.sessionCookieValue ?? ""}`,
        [BFF_CSRF_HEADER]: issueResult?.csrfToken ?? "",
        "content-type": "application/json",
      },
      body: "{}",
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("archlucid-bff-session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
