import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/access-request-email", () => ({
  sendAccessRequestNotification: vi.fn(async () => undefined),
}));

import { POST } from "@/app/api/access-requests/route";
import { sendAccessRequestNotification } from "@/lib/server/access-request-email";
import {
  resetAccessRequestAuditStateForTests,
} from "@/lib/server/access-request-audit-log";
import { resetAccessRequestRateLimitStateForTests } from "@/lib/server/access-request-rate-limit";

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/access-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.10",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/access-requests", () => {
  beforeEach(() => {
    resetAccessRequestAuditStateForTests();
    resetAccessRequestRateLimitStateForTests();
    vi.mocked(sendAccessRequestNotification).mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 204 for a valid request", async () => {
    vi.stubEnv("ACCESS_REQUEST_RECIPIENT_EMAIL", "ops@example.com");
    vi.stubEnv("ACCESS_REQUEST_EMAIL_DRY_RUN", "1");

    const response = await POST(
      buildRequest({
        name: "Jordan Lee",
        workEmail: "jordan@fabrikam.com",
        company: "Fabrikam",
        roleTitle: "Cloud architect",
        websiteUrl: "",
      }),
    );

    expect(response.status).toBe(204);
    expect(sendAccessRequestNotification).toHaveBeenCalledOnce();
  });

  it("returns 409 for duplicate recent email submissions", async () => {
    vi.stubEnv("ACCESS_REQUEST_RECIPIENT_EMAIL", "ops@example.com");
    vi.stubEnv("ACCESS_REQUEST_EMAIL_DRY_RUN", "1");

    const body = {
      name: "Jordan Lee",
      workEmail: "jordan@fabrikam.com",
      company: "Fabrikam",
      roleTitle: "Cloud architect",
      websiteUrl: "",
    };

    const first = await POST(buildRequest(body));
    const second = await POST(buildRequest(body));

    expect(first.status).toBe(204);
    expect(second.status).toBe(409);
  });

  it("returns 204 for honeypot submissions without sending email", async () => {
    vi.stubEnv("ACCESS_REQUEST_RECIPIENT_EMAIL", "ops@example.com");
    vi.stubEnv("ACCESS_REQUEST_EMAIL_DRY_RUN", "1");

    const response = await POST(
      buildRequest({
        name: "Bot",
        workEmail: "bot@fabrikam.com",
        company: "Fabrikam",
        roleTitle: "Architect",
        websiteUrl: "https://spam.example",
      }),
    );

    expect(response.status).toBe(204);
    expect(sendAccessRequestNotification).not.toHaveBeenCalled();
  });
});
