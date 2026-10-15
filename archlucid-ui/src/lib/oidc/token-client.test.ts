import { afterEach, describe, expect, it, vi } from "vitest";

import { refreshAccessToken } from "@/lib/oidc/token-client";

describe("refreshAccessToken", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("trims surrounding whitespace from access_token in successful token responses", async () => {
    const jwtPayload = { sub: "user-42", name: "Whitespace User" };
    const segment = Buffer.from(JSON.stringify(jwtPayload), "utf8").toString("base64url");
    const accessToken = `x.${segment}.y`;
    const paddedAccessToken = `  ${accessToken}  `;

    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ access_token: paddedAccessToken, token_type: "Bearer" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await refreshAccessToken({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      refreshToken: "rt",
    });

    expect(tokens.access_token).toBe(accessToken);
  });

  it("throws when a successful token response omits access_token", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ token_type: "Bearer" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/missing access_token/i);
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

  it("collapses line breaks in OAuth error descriptions from the token endpoint", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant",
          error_description: "expired\r\ninjected",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let message = "";

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toBe("invalid_grant: expired injected");
    expect(message).not.toMatch(/\r|\n/u);
  });

  it("throws a buyer-safe error when the token endpoint returns non-JSON success bodies", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => "<html>not json</html>",
    }));

    vi.stubGlobal("fetch", fetchMock);

    let message = "";

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toBe("Token response was not valid JSON");
    expect(message.toLowerCase()).not.toContain("html");
  });

  it("does not echo non-OAuth error response bodies in thrown errors", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 502,
      text: async () => "<html><body>gateway failure</body></html>",
    }));

    vi.stubGlobal("fetch", fetchMock);

    let message = "";

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toBe("Token endpoint error 502");
    expect(message.toLowerCase()).not.toContain("html");
    expect(message.toLowerCase()).not.toContain("gateway failure");
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
