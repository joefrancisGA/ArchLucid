import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./[...path]/route";
import {
  BFF_SESSION_COOKIE_NAME,
  createBffSessionCookieValue,
} from "@/lib/proxy/bff-session-cookie";
import { resetProxyRateLimitStateForTests } from "@/lib/proxy-rate-limit";

describe("sandbox proxy BFF activity slide", () => {
  beforeEach(() => {
    resetProxyRateLimitStateForTests();
    vi.stubEnv("ARCHLUCID_BFF_SESSION_SIGNING_SECRET", "sandbox-bff-slide-secret");
    vi.stubEnv("ARCHLUCID_UI_SANDBOX_MOCKS", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("slides the HttpOnly session cookie when a sandbox GET returns before upstream fetch", async () => {
    const issueResult = createBffSessionCookieValue({
      accessToken: "access-token",
      expiresAtMs: Date.now() + 3_600_000,
      workingMode: true,
    });

    const req = new NextRequest("http://localhost/api/proxy/v1/architecture/telemetry/roi", {
      headers: {
        cookie: `${BFF_SESSION_COOKIE_NAME}=${issueResult?.sessionCookieValue ?? ""}`,
      },
    });

    const res = await GET(req, {
      params: Promise.resolve({ path: ["v1", "architecture", "telemetry", "roi"] }),
    });

    expect(res.status).toBe(200);
    const setCookies = res.headers.getSetCookie();
    expect(setCookies.some((header) => header.startsWith(`${BFF_SESSION_COOKIE_NAME}=`))).toBe(true);
  });
});
