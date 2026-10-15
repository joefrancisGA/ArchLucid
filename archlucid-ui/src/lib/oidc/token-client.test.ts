import { afterEach, describe, expect, it, vi } from "vitest";

import { refreshAccessToken } from "@/lib/oidc/token-client";

describe("refreshAccessToken", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("rejects token endpoints that embed userinfo before calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://user:pass@login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/invalid token endpoint URL/i);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws OAuth errors returned with HTTP 200 instead of treating them as token responses", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant",
          error_description: "refresh token expired",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/invalid_grant/i);
  });
});
