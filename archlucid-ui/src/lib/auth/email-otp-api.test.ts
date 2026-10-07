import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { requestEmailOtpChallenge, verifyEmailOtpCode } from "@/lib/auth/email-otp-api";

describe("requestEmailOtpChallenge (pre-auth proxy)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns success for neutral API bodies that omit challengeId (anti-enumeration contract)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: "If this address is eligible, you will receive a code.",
        ssoRequired: false,
      }),
    });

    const result = await requestEmailOtpChallenge("operator@example.com", null);

    expect(result.kind).toBe("success");

    if (result.kind === "success") {
      expect(result.response.challengeId ?? null).toBeNull();
    }
  });

  it("returns delivery_failed when the API marks emailDeliverySucceeded false", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: "Delivery failed.",
        ssoRequired: false,
        emailDeliverySucceeded: false,
      }),
    });

    const result = await requestEmailOtpChallenge("operator@example.com", null);

    expect(result).toEqual({ kind: "failure", category: "delivery_failed" });
  });

  it("maps challenge HTTP 400 validation failures to unknown (asymmetric with verify 401 invalid_code)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 400 }));

    const result = await requestEmailOtpChallenge("operator@example.com", null);

    expect(result).toEqual({ kind: "failure", category: "unknown" });
  });

  it("returns success when the API sets ssoRequired on the challenge body (UI applyChallengeSuccess handles SSO)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: "Use your organization SSO.",
        ssoRequired: true,
        ssoMessage: "Contact your admin.",
      }),
    });

    const result = await requestEmailOtpChallenge("operator@example.com", null);

    expect(result.kind).toBe("success");

    if (result.kind === "success") {
      expect(result.response.ssoRequired).toBe(true);
    }
  });
});

describe("verifyEmailOtpCode (pre-auth proxy)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps verify HTTP 400 validation failures to unknown", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 400 }));

    const result = await verifyEmailOtpCode("challenge-id", "123456", null);

    expect(result).toEqual({ kind: "failure", category: "unknown" });
  });

  it("maps verify HTTP 401 to invalid_code per API contract", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

    const result = await verifyEmailOtpCode("challenge-id", "123456", null);

    expect(result).toEqual({ kind: "failure", category: "invalid_code" });
  });

  it("maps verify HTTP 410 to unknown because EmailOtpAuthController documents only 200 and 401", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 410 }));

    const result = await verifyEmailOtpCode("challenge-id", "123456", null);

    expect(result).toEqual({ kind: "failure", category: "unknown" });
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
