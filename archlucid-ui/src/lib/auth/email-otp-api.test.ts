import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyEmailOtpCode } from "@/lib/auth/email-otp-api";

describe("verifyEmailOtpCode (pre-auth proxy)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("still POSTs when challengeId is empty (callers must guard before invoke)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ accessToken: "token" }), { status: 200 }),
    );

    await verifyEmailOtpCode("", "123456", null);

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    const body = JSON.parse(String(init?.body)) as { challengeId: string };

    expect(body.challengeId).toBe("");
  });
});
