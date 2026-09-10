import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DELETE, POST } from "@/app/api/auth/bff-session/route";

const TEST_SECRET = "bff-session-route-test-secret";
const ORIGIN = "http://localhost:3000";

function buildPostRequest(options?: {
  readonly origin?: string | null;
  readonly body?: Record<string, unknown>;
}): NextRequest {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (options?.origin !== null) {
    headers.set("Origin", options?.origin ?? ORIGIN);
  }

  return new NextRequest(`${ORIGIN}/api/auth/bff-session`, {
    method: "POST",
    headers,
    body: JSON.stringify(
      options?.body ?? {
        access_token: "access-token-1",
        expires_in: 3600,
      },
    ),
  });
}

describe("POST /api/auth/bff-session", () => {
  beforeEach(() => {
    process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET;
  });

  it("issues a BFF session cookie for same-origin posts", async () => {
    const response = await POST(buildPostRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("archlucid-bff-session=");
  });

  it("rejects cross-origin session establishment posts", async () => {
    const response = await POST(
      buildPostRequest({
        origin: "https://evil.example",
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

describe("DELETE /api/auth/bff-session", () => {
  beforeEach(() => {
    process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.ARCHLUCID_BFF_SESSION_SIGNING_SECRET;
  });

  it("rejects cross-origin session teardown requests", async () => {
    const response = await DELETE(
      new NextRequest(`${ORIGIN}/api/auth/bff-session`, {
        method: "DELETE",
        headers: {
          Origin: "https://evil.example",
        },
      }),
    );

    expect(response.status).toBe(403);
  });
});
