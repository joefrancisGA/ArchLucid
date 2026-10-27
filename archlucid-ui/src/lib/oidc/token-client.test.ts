import { afterEach, describe, expect, it, vi } from "vitest";

import { OIDC_AUTHORIZE_CALLBACK_FAILED_KEY } from "@/lib/oidc/storage-keys";
import {
  exchangeAuthorizationCode,
  isOAuthRefreshTokenRejectedError,
  OAuthTokenEndpointError,
  refreshAccessToken,
  shouldMarkAuthorizeCallbackFailedOnExchangeError,
} from "@/lib/oidc/token-client";

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

  it("coerces string expires_in to a number on the parsed token object while normalizing access_token", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({ access_token: "access-1", expires_in: "7200", token_type: "Bearer" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await refreshAccessToken({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      refreshToken: "rt",
    });

    expect(tokens.access_token).toBe("access-1");
    expect(tokens.expires_in).toBe(7200);
  });

  it("maps empty array expires_in on token JSON to the default lifetime on the parsed object", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({ access_token: "access-1", expires_in: [], token_type: "Bearer" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await refreshAccessToken({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      refreshToken: "rt",
    });

    expect(tokens.access_token).toBe("access-1");
    expect(tokens.expires_in).toBe(3600);
  });

  it("strips zero-width characters from access_token in successful token responses", async () => {
    const jwtPayload = { sub: "user-42", name: "Invisible User" };
    const segment = Buffer.from(JSON.stringify(jwtPayload), "utf8").toString("base64url");
    const accessToken = `x.${segment}.y`;
    const paddedAccessToken = `\u200b${accessToken}\u200b`;

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

  it("throws when a successful token response body is a JSON string root", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify("not-a-token-response"),
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

  it("throws when a successful token response body is an empty JSON object", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({}),
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

  it("throws when a successful token response body is JSON null", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(null),
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

  it("throws when a successful token response body is an empty JSON array", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify([]),
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

  it("throws when a successful token response body is the JSON number 42", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(42),
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

  it("throws when a successful token response body is the JSON number -1", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(-1),
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

  it("throws when a successful token response body is the JSON number 0", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(0),
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

  it("throws when a successful token response body is the JSON number 2", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(2),
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

  it("throws when a successful token response body is the JSON number 3", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(3),
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

  it("throws when a successful token response body is the JSON number 4", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(4),
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

  it("throws when a successful token response body is the JSON number 5", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(5),
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

  it("throws when a successful token response body is the JSON number 6", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(6),
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

  it("throws when a successful token response body is the JSON number 7", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(7),
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

  it("throws when a successful token response body is the JSON number 8", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(8),
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

  it("throws when a successful token response body is the JSON number 9", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(9),
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

  it("throws when a successful token response body is the JSON literal false", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(false),
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

  it("throws when a successful token response body is the JSON literal true", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(true),
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

  it("does not mark authorize callback failed when token endpoint URL is invalid", async () => {
    sessionStorage.clear();

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "javascript:alert(1)",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Invalid token endpoint URL/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("preserves authorize retry marking for OAuthTokenEndpointError exchange failures", () => {
    expect(
      shouldMarkAuthorizeCallbackFailedOnExchangeError(
        new OAuthTokenEndpointError("Sign-in did not finish (invalid grant).", "invalid_grant"),
      ),
    ).toBe(true);
    expect(shouldMarkAuthorizeCallbackFailedOnExchangeError(new Error("Invalid token endpoint URL"))).toBe(
      false,
    );
    expect(
      shouldMarkAuthorizeCallbackFailedOnExchangeError(
        new OAuthTokenEndpointError(
          "Your identity provider reported a temporary error. Wait a minute and try signing in again.",
          "server_error",
        ),
      ),
    ).toBe(true);
    expect(shouldMarkAuthorizeCallbackFailedOnExchangeError(new Error("Token endpoint error 502"))).toBe(true);
    expect(shouldMarkAuthorizeCallbackFailedOnExchangeError(new Error("Token response was not valid JSON"))).toBe(
      true,
    );
  });

  it("marks authorize callback failed when authorization code exchange returns an opaque HTTP error body", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 502,
        text: async () => "<html><body>gateway failure</body></html>",
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Token endpoint error 502/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a non-JSON success body", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => "<html>not json</html>",
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/not valid JSON/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange omits access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ token_type: "Bearer" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an empty access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a whitespace-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "  \u200b  " }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a zero-width-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u200b" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a zero-width-non-joiner-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u200c" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a zero-width-joiner-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u200d" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a soft-hyphen-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u00ad" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a soft-hyphen and variation-selector-16-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u00AD\uFE0F" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a soft-hyphen and object-replacement-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u00AD\uFFFC" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a soft-hyphen and replacement-character-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u00AD\uFFFD" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a byte-order-mark-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\ufeff" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a word-joiner-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2060" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an object-replacement-character-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\ufffc" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a soft-hyphen and object-replacement-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u00AD\uFFFC" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a soft-hyphen object-replacement and variation-selector-16-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u00AD\uFFFC\uFE0F" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a soft-hyphen object-replacement and replacement-character-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u00AD\uFFFC\uFFFD" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a soft-hyphen object-replacement replacement-character and variation-selector-16-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u00AD\uFFFC\uFFFD\uFE0F" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an object-replacement and replacement-character-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFFFC\uFFFD" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an object-replacement replacement-character and variation-selector-16-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFFFC\uFFFD\uFE0F" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an object-replacement and variation-selector-16-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFFFC\uFE0F" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an object-replacement replacement-character and variation-selector-16-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFFFC\uFFFD\uFE0F" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a replacement-character-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\ufffd" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a replacement-character and variation-selector-16-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFFFD\uFE0F" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a soft-hyphen replacement-character and variation-selector-16-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u00AD\uFFFD\uFE0F" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE0F" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-15-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE0E" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-14-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE0D" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-13-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE0C" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-12-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE0B" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-11-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE0A" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-10-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE09" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-8-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE07" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-9-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE08" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-8-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE07" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-7-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE06" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-6-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE05" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-3-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE02" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-5-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE04" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-4-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE03" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-3-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE02" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-2-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE01" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a variation-selector-1-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\uFE00" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a tab-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\t" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a newline-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\n" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a carriage-return-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\r" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a CRLF-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\r\n" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a form-feed-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\f" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a vertical-tab-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\v" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a no-break-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u00a0" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a thin-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2009" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a hair-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u200a" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a narrow-no-break-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u202f" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a medium-mathematical-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u205f" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an em-quad-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2001" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an en-quad-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2000" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an en-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2002" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an em-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2003" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a three-per-em-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2004" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a four-per-em-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2005" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a six-per-em-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2006" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an ideographic-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u3000" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a figure-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2007" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a punctuation-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2008" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a four-per-em-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2005" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a six-per-em-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2006" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a three-per-em-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2004" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an en-space-only access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "\u2002" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a numeric access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: 12345 }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns a boolean access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: true }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns null access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: null }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an array access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: ["token-a"] }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns an object access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: { value: "token-a" } }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/missing access_token/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("does not mark authorize callback failed when authorization code exchange returns a numeric-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "12345" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("12345");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("does not mark authorize callback failed when authorization code exchange returns a single-digit-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "0" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("0");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("does not mark authorize callback failed when authorization code exchange returns a boolean-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "false" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("false");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("does not mark authorize callback failed when authorization code exchange returns true-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "true" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("true");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("does not mark authorize callback failed when authorization code exchange returns null-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "null" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("null");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("does not mark authorize callback failed when authorization code exchange returns undefined-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "undefined" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("undefined");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("does not mark authorize callback failed when authorization code exchange returns NaN-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "NaN" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("NaN");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("does not mark authorize callback failed when authorization code exchange returns Infinity-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "Infinity" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("Infinity");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("does not mark authorize callback failed when authorization code exchange returns negative-Infinity-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "-Infinity" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("-Infinity");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("does not mark authorize callback failed when authorization code exchange returns object-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "[object Object]" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("[object Object]");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("does not mark authorize callback failed when authorization code exchange returns empty-array-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "[]" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("[]");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("does not mark authorize callback failed when authorization code exchange returns empty-object-string access_token", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => JSON.stringify({ access_token: "{}" }),
      })),
    );

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("{}");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("marks authorize callback failed when authorization code exchange fails", async () => {
    sessionStorage.clear();

    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "invalid_grant" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Sign-in did not finish \(invalid grant\)/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns transient server_error", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 503,
        text: async () => JSON.stringify({ error: "server_error" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/temporary error/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns transient authorization_pending", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: "authorization_pending" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/authorization pending/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns transient slow_down", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: "slow_down" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/slow down/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns transient temporarily_unavailable", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 503,
        text: async () => JSON.stringify({ error: "temporarily_unavailable" }),
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/temporary error/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("marks authorize callback failed when authorization code exchange returns opaque token endpoint HTTP error", async () => {
    sessionStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 502,
        text: async () => "<html>Bad Gateway</html>",
      })),
    );

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Token endpoint error 502/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("humanizes unsupported_response_type authorization code exchange errors instead of raw snake_case", async () => {
    sessionStorage.clear();

    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "unsupported_response_type" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Sign-in did not finish \(unsupported response type\)/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("humanizes unsupported_token_type authorization code exchange errors instead of raw snake_case", async () => {
    sessionStorage.clear();

    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "unsupported_token_type" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Sign-in did not finish \(unsupported token type\)/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("humanizes unsupported_grant_type authorization code exchange errors instead of raw snake_case", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "unsupported_grant_type" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Sign-in did not finish \(unsupported grant type\)/i);
  });

  it("humanizes redirect_uri_mismatch authorization code exchange errors instead of raw snake_case", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "redirect_uri_mismatch" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Sign-in did not finish \(redirect uri mismatch\)/i);
  });

  it("humanizes invalid_client authorization code exchange errors instead of raw snake_case", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: "invalid_client" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Sign-in did not finish \(invalid client\)/i);
  });

  it("humanizes invalid_grant authorization code exchange errors like access_denied", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant",
          error_description: "Authorization code expired",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/invalid grant: Authorization code expired/);
  });

  it("humanizes token JSON error codes with trailing control characters", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant\u000b",
          error_description: "Authorization code expired",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/invalid grant: Authorization code expired/);
  });

  it("surfaces incomplete IdP copy when token JSON error collapses to empty after normalization", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "\u0007" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error_description field is an empty string only", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_description: "" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error field is a non-string object", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: { code: "invalid_grant" } }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error field is a non-string array", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: [] }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error field is an empty string", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token error JSON root is a whitespace string", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify("   "),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token error response body is whitespace only", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => "   ",
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error body has no OAuth error fields", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ foo: "bar" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error body is an empty object", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error body is an empty array", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify([]),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error_description is a broken object coercion string only", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_description: "[object Object]" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toContain("[object Object]");
  });

  it("surfaces incomplete IdP copy when token JSON error is a string but error_description is an object", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({ error: "invalid_grant", error_description: { msg: "The code expired" } }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toContain("code expired");
  });

  it("surfaces incomplete IdP copy when HTTP 200 JSON has only error_uri without access_token", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ error_uri: "https://idp.example/errors/1" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/We did not receive a complete response from your identity provider/i);
  });

  it("still parses a successful token response when access_token is present alongside numeric-string error metadata", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "403",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("access-1");
  });

  it("rejects a successful HTTP 200 token response when access_token and a real OAuth error are both present", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "invalid_grant",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/invalid grant|sign-in/i);
  });

  it("still parses a successful token response when access_token is present alongside numeric JSON error metadata", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: 403,
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("access-1");
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside placeholder error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "null",
          error_description: "Policy denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Policy denied|complete response from your identity provider/i);
  });

  it("still parses a successful token response when access_token is present alongside placeholder-string error", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "null",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("access-1");
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside boolean JSON error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: true,
          error_description: "Denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Denied|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside false boolean JSON error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: false,
          error_description: "Denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Denied|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside boolean JSON error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: true,
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside non-string error JSON without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: [],
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("still parses a successful token response when access_token is present alongside empty-string error", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("access-1");
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside placeholder NaN string error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "NaN",
          error_description: "Denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Denied|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside placeholder Infinity string error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "Infinity",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside invisible-format-char-prefixed allowed numeric-string error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "\u200b403",
          error_description: "Forbidden",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Forbidden|complete response from your identity provider/i);
  });

  it("still parses a successful token response when access_token is present alongside invisible-format-char-prefixed allowed numeric-string error metadata", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "\u200b403",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("access-1");
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside non-finite placeholder error strings with leading invisible format characters", async () => {
    for (const error of ["\u200bInfinity", "\u200b+NaN", "\uFEFF-Infinity"]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(/complete response from your identity provider/i);
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside signed non-finite placeholder error strings without error_description", async () => {
    for (const error of ["+Infinity", "+NaN", "-NaN"]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(/complete response from your identity provider/i);
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside octal-prefix numeric-string error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "0o777",
          error_description: "Denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Denied|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside octal-prefix numeric-string error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "0o777",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside hex numeric-string error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "0x403",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside signed out-of-range numeric-string error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "-1",
          error_description: "Denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Denied|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside signed allowed numeric-string error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "+403",
          error_description: "Forbidden",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Forbidden|complete response from your identity provider/i);
  });

  it("still parses a successful token response when access_token is present alongside signed allowed numeric-string error metadata without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "+403",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("access-1");
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside scientific-notation numeric-string error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "1e2",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside out-of-range numeric-string error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "600",
          error_description: "Denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Denied|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside fractional numeric-string error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "403.5",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside leading-zero allowed numeric-string error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "0403",
          error_description: "Denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Denied|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside non-integer numeric JSON error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: 403.5,
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside zero numeric-string error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "0",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside allowed numeric-string error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "403",
          error_description: "Forbidden",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Forbidden|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside out-of-range numeric-string error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "200",
          error_description: "Denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Denied|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside zero numeric JSON error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: 0,
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside explicit null error and readable error_description without error_uri", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: null,
          error_description: "Denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Denied|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside hollow error and usable error_uri without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "",
          error_uri: "https://idp.example/errors/1",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside invisible-format-char-only error and usable error_uri without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "\u200b",
          error_uri: "https://idp.example/errors/1",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside explicit null error and usable error_uri", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: null,
          error_uri: "https://idp.example/errors/1",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside explicit null error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: null,
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside non-string error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: [],
          error_description: "Policy denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Policy denied|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside hollow error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "",
          error_description: "Policy denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Policy denied|complete response from your identity provider/i);
  });

  it("still parses a successful token response when hollow error and error_uri metadata accompany access_token", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "",
          error_uri: "https://idp.example/errors/1",
          error_description: "Optional notice",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("access-1");
  });

  it("still parses a successful token response when access_token is present alongside hollow error and coercion-only error_uri", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "",
          error_uri: "[object Object]",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("access-1");
  });

  it("still parses a successful token response when access_token is present alongside coercion-only error_uri without error", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error_uri: "[object Object]",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(tokens.access_token).toBe("access-1");
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside snake_case object_object error metadata", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "object_object",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside snake_case object_arguments error metadata", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "object_arguments",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside snake_case object_map error metadata", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "object_map",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph temporarily_unavailable without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "temporarily_unavai\u043bable",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/temporary|identity provider|complete response/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph invalid_grant with cyrillic и without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "inval\u0438d_grant",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/invalid grant|identity provider|complete response/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph unsupported_response_type misspellings without error_description", async () => {
    for (const error of [
      "unsupported_respo\u043ese_type",
      "unsupported_resp\u043en\u0441e_type",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(/response type|identity provider|complete response/i);
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside misspelled unsupported_grant_type and unsupported_token_type without error_description", async () => {
    for (const error of ["unsupported_granto_type", "unsupported_token_typ"]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(/grant type|token type|identity provider|complete response/i);
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside common humanized OAuth error misspellings without error_description", async () => {
    for (const error of [
      "redirect_uri_misatch",
      "redirect_url_mismatch",
      "invalid_requst",
      "expired_tokn",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /redirect|invalid|expired|sign-in request|identity provider|complete response|sign-in did not finish/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside misspelled access and session OAuth errors without error_description", async () => {
    for (const error of ["access_denyed", "login_requred", "server_eror", "invalid_scop"]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|sign-in|scope|permissions|temporary|identity provider|complete response|server/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside misspelled grant and token OAuth errors without error_description", async () => {
    for (const error of [
      "consent_requred",
      "invalid_grnt",
      "invalid_tokn",
      "redirect_uri_mismach",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /consent|grant|token|redirect|identity provider|complete response|sign-in/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional eroded-stem and heptadecuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsuppo",
      "redir",
      "author",
      "login_requiredssssssssssssssss",
      "interaction_requiredssssssssssssssss",
      "consent_requiredssssssssssssssss",
      "server_errorssssssssssssssss",
      "invalid_clientssssssssssssxxxx",
      "unauthorized_clientssssssssssssxxxxx",
      "insufficient_scopeesssssssssssss",
      "interaction_requireddddddddddddddd",
      "invalid_grantsstttttttttttttt",
      "access_deniedsssssssssssssss",
      "unsupported_response_typeeeeeeee",
      "invalid_grantttttttttt",
      "invalid_gr",
      "slow_dw",
      "unsupportd",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional unvigintiverse-stem-clip and unvigintimillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional vigintiverse-stem-clip and vigintimillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional novemverse-stem-clip and novemdecimillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional quettaverse-stem-clip and octodecimillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional ronnaverse-stem-clip and septendecimillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional yottiverse-stem-clip and sedecimillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional zettaverse-stem-clip and quindecimillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional exaverse-stem-clip and quattuordecimillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional petaverse-stem-clip and tredecimillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional teraverse-stem-clip and duodecimillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional gigaverse-stem-clip and undecimillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional megaverse-stem-clip and decemillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional ultraverse-stem-clip and novemillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional xenoverse-stem-clip and octomillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional hyperversal-stem-clip and septemmillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional metaversal-stem-clip and sexmillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional omniversal-stem-clip and quinquemillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional multiversal-stem-clip and quadmillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional universal-stem-clip and tremillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional galactic-stem-clip and duomillenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional cosmic-stem-clip and millenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional aeon-stem-clip and nongentenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional eon-stem-clip and octingentenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional millennium-stem-clip and septingentenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional century-stem-clip and sescentenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional decade-stem-clip and quingentenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional year-stem-clip and quadringentenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional month-stem-clip and ducentenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional week-stem-clip and trecentenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional day-stem-clip and trecentavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional hour-stem-clip and ducentenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional minute-stem-clip and ducentavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional second-stem-clip and centenvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional decisecond-stem-clip and centavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional centisecond-stem-clip and nonagintavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional millisecond-stem-clip and octogintavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional microsecond-stem-clip and septuagintavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional nanosecond-stem-clip and sexagintavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional picosecond-stem-clip and quinquagintavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional femtosecond-stem-clip and quadragintavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional yoctosecond-stem-clip and trigintavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional zeptosecond-stem-clip and novemvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional attosecond-stem-clip and octavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional instant-stem-clip and septuavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttttt",
      "authorizaton",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional chronon-stem-clip and sexavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttttt",
      "authorizaton_",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional planck-stem-clip and quinquavigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredsssssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssssss",
      "server_errorssssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssssss",
      "interaction_requireddddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttttt",
      "access_deniedsssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttttt",
      "authorizaton_p",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional yocto-stem-clip and quadravigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "login_requiredssssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssssss",
      "server_errorsssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssssss",
      "interaction_requiredddddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttttt",
      "access_deniedssssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeeee",
      "invalid_granttttttttttttttttt",
      "authorizaton_pe",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional zepto-fragment and tresvigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "us",
      "login_requiredsssssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssssss",
      "consent_requiredssssssssssssssssssssss",
      "server_errorssssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxxx",
      "insufficient_scopeesssssssssssssssssss",
      "interaction_requireddddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttttt",
      "access_deniedsssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeeee",
      "invalid_grantttttttttttttttt",
      "authorizaton_pen",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional atto-fragment and duovigesimal-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "u",
      "login_requiredssssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssssss",
      "consent_requiredsssssssssssssssssssss",
      "server_errorsssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxxx",
      "insufficient_scopeessssssssssssssssss",
      "interaction_requiredddddddddddddddddddd",
      "invalid_grantssttttttttttttttttttt",
      "access_deniedssssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeeee",
      "invalid_granttttttttttttttt",
      "s",
      "authorizaton_pend",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional femto-fragment and unicosidecuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "un",
      "r",
      "login_requiredsssssssssssssssssssssss",
      "interaction_requiredssssssssssssssssssss",
      "consent_requiredssssssssssssssssssss",
      "server_errorssssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxxx",
      "insufficient_scopeesssssssssssssssss",
      "interaction_requireddddddddddddddddddd",
      "invalid_grantsstttttttttttttttttt",
      "access_deniedsssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeeee",
      "invalid_grantttttttttttttt",
      "authorizaton_pendi",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional pico-fragment and icosadecuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "uns",
      "re",
      "au",
      "login_requiredssssssssssssssssssssss",
      "interaction_requiredsssssssssssssssssss",
      "consent_requiredsssssssssssssssssss",
      "server_errorsssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxxx",
      "insufficient_scopeessssssssssssssss",
      "interaction_requiredddddddddddddddddd",
      "invalid_grantssttttttttttttttttt",
      "access_deniedssssssssssssssssss",
      "unsupported_response_typeeeeeeeeeee",
      "invalid_granttttttttttttt",
      "invalid",
      "authorizaton_pendin",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional nano-fragment and nonadecuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsu",
      "red",
      "auth",
      "login_requiredssssssssssssssssssss",
      "interaction_requiredssssssssssssssssss",
      "consent_requiredssssssssssssssssss",
      "server_errorssssssssssssssssss",
      "invalid_clientssssssssssssxxxxxx",
      "unauthorized_clientssssssssssssxxxxxxx",
      "insufficient_scopeesssssssssssssss",
      "interaction_requireddddddddddddddddd",
      "invalid_grantsstttttttttttttttt",
      "access_deniedsssssssssssssssss",
      "unsupported_response_typeeeeeeeeee",
      "invalid_grantttttttttttt",
      "authorizaton_pendng",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional micro-fragment and octadecuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupp",
      "redi",
      "autho",
      "login_requiredssssssssssssssssss",
      "interaction_requiredsssssssssssssssss",
      "consent_requiredsssssssssssssssss",
      "server_errorsssssssssssssssss",
      "invalid_clientssssssssssssxxxxx",
      "unauthorized_clientssssssssssssxxxxxx",
      "insufficient_scopeessssssssssssss",
      "interaction_requiredddddddddddddddd",
      "invalid_grantssttttttttttttttt",
      "access_deniedssssssssssssssss",
      "unsupported_response_typeeeeeeeee",
      "invalid_granttttttttttt",
      "invalid_g",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional progressive-stem and hexadecuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsuppor",
      "redire",
      "authori",
      "login_requiredsssssssssssssss",
      "interaction_requiredsssssssssssssss",
      "consent_requiredsssssssssssssss",
      "server_errorsssssssssssssss",
      "invalid_clientsssssssssssssss",
      "unauthorized_clientsssssssssssssss",
      "insufficient_scopeessssssssssss",
      "interaction_requiredddddddddddddd",
      "invalid_grantssttttttttttttt",
      "access_deniedssssssssssssss",
      "unsupported_response_typeeeeeee",
      "invalid_granttttttttt",
      "invalid_gra",
      "slow_dwn",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional consonant-cluster and pentadecuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupport",
      "redirec",
      "authoriz",
      "login_requiredssssssssssssss",
      "interaction_requiredssssssssssssss",
      "consent_requiredssssssssssssss",
      "server_errorssssssssssssss",
      "invalid_clientssssssssssssss",
      "unauthorized_clientssssssssssssss",
      "insufficient_scopeesssssssssss",
      "interaction_requireddddddddddddd",
      "invalid_grantsstttttttttttt",
      "access_deniedsssssssssssss",
      "unsupported_response_typeeeeee",
      "invalid_grantttttttt",
      "interacton_required",
      "invalid_grat",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional stem-truncation and vowel-drop OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupporte",
      "redirect",
      "authoriza",
      "login_requiredsssssssssssss",
      "interaction_requiredsssssssssssss",
      "consent_requiredsssssssssssss",
      "server_errorsssssssssssss",
      "invalid_clientsssssssssssss",
      "unauthorized_clientsssssssssssss",
      "insufficient_scopeessssssssss",
      "interaction_requiredddddddddddd",
      "invalid_grantssttttttttttt",
      "access_deniedssssssssssss",
      "unsupported_response_typeeeee",
      "invalid_granttttttt",
      "interacion_required",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional bare-stem and tredecuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupported",
      "redirect_",
      "a",
      "in",
      "authorizat",
      "login_requiredssssssssssss",
      "interaction_requiredssssssssssss",
      "consent_requiredssssssssssss",
      "server_errorssssssssssss",
      "invalid_clientssssssssssss",
      "unauthorized_clientssssssssssss",
      "insufficient_scopeesssssssss",
      "interaction_requireddddddddddd",
      "invalid_grantsstttttttttt",
      "access_deniedsssssssssss",
      "temporarily_",
      "unsupported_response_typeeee",
      "invalid_grantttttt",
      "temporaily_unavailable",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional subatom-prefix and duodecuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupported_r",
      "unsupported_",
      "redirect_u",
      "ac",
      "inv",
      "sl_",
      "authorizati",
      "login_requiredsssssssssss",
      "interaction_requiredsssssssssss",
      "consent_requiredsssssssssss",
      "server_errorsssssssssss",
      "invalid_clientsssssssssss",
      "unauthorized_clientsssssssssss",
      "insufficient_scopeessssssss",
      "interaction_requiredddddddddd",
      "invalid_grantssttttttttt",
      "access_deniedssssssssss",
      "temporarily_u",
      "unsupported_response_typeee",
      "invalid_granttttt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional atom-prefix and undecuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupported_res",
      "unsupported_re",
      "redirect_ur",
      "acc",
      "inva",
      "slo_",
      "authorizatio",
      "login_requiredssssssssss",
      "interaction_requiredssssssssss",
      "consent_requiredssssssssss",
      "server_errorssssssssss",
      "invalid_clientssssssssss",
      "unauthorized_clientssssssssss",
      "insufficient_scopeesssssss",
      "interaction_requireddddddddd",
      "invalid_grantsstttttttt",
      "access_deniedsssssssss",
      "temporarily_un",
      "unsupported_response_typee",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional splinter-prefix and decuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupported_resp",
      "redirect_uri_",
      "acce",
      "inval",
      "sl",
      "authorization_",
      "login_requiredsssssssss",
      "interaction_requiredsssssssss",
      "consent_requiredsssssssss",
      "server_errorsssssssss",
      "invalid_clientsssssssss",
      "unauthorized_clientsssssssss",
      "insufficient_scopeessssss",
      "interaction_requiredddddddd",
      "invalid_grantssttttttt",
      "access_deniedssssssss",
      "temporarily_una",
      "consent_requiredddddddd",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional shard-prefix and nonuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupported_respo",
      "unsupported_respons_",
      "redirect_uri_m",
      "acces",
      "invali",
      "slo",
      "authorization_p",
      "login_requiredssssssss",
      "interaction_requiredssssssss",
      "consent_requiredssssssss",
      "server_errorssssssss",
      "invalid_clientssssssss",
      "unauthorized_clientssssssss",
      "insufficient_scopeesssss",
      "interaction_requireddddddd",
      "invalid_grantsstttttt",
      "access_deniedsssssss",
      "temporarily_unav",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional fragment-prefix and octuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupported_respons",
      "unsupported_respon",
      "invalid_grant_",
      "invalid_grant_tyys",
      "redirect_uri_mi",
      "access_",
      "invalid_",
      "slow_",
      "authorization_pe",
      "login_requiredsssssss",
      "interaction_requiredsssssss",
      "consent_requiredsssssss",
      "server_errorsssssss",
      "invalid_clientsssssss",
      "unauthorized_clientsssssss",
      "insufficient_scopeessss",
      "interaction_requiredddddd",
      "invalid_grantssttttt",
      "access_deniedssssss",
      "temporarily_unava",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional nano-prefix and septuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupported_response_",
      "unsupported_responset",
      "invalid_grant_t",
      "invalid_grant_tyy",
      "redirect_uri_mis",
      "access_d",
      "invalid_r",
      "slow_d",
      "authorization_pen",
      "login_requiredssssss",
      "interaction_requiredssssss",
      "consent_requiredssssss",
      "server_errorssssss",
      "invalid_clientssssss",
      "unauthorized_clientssssss",
      "insufficient_scopeesss",
      "consent_requireddddd",
      "invalid_grantsstttt",
      "access_deniedsssss",
      "temporarily_unavai",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional micro-prefix and sextuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupported_response_t",
      "unsupported_responsety",
      "invalid_grant_ty",
      "invalid_grant_typ",
      "redirect_uri_mism",
      "access_de",
      "invalid_re",
      "login_requiredsssss",
      "interaction_requiredsssss",
      "consent_requiredsssss",
      "server_errorsssss",
      "invalid_clientsssss",
      "unauthorized_clientsssss",
      "insufficient_scopeess",
      "interaction_requiredddd",
      "invalid_grantssttt",
      "access_deniedssss",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional clipped-prefix and quintuple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupported_response_ty",
      "unsupported_responsetyp",
      "invalid_grant_typo",
      "invalid_grant_typos",
      "redirect_uri_misma",
      "access_den",
      "invalid_req",
      "slow_dow",
      "authorization_pendi",
      "login_requiredssss",
      "interaction_requiredssss",
      "consent_requiredssss",
      "server_errorssss",
      "invalid_clientssss",
      "unauthorized_clientssss",
      "insufficient_scopess",
      "temporarily_unavaila",
      "consent_requireddd",
      "invalid_grantsstt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional truncated-word and quadruple-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupported_responstype",
      "invalid_grant_typeos",
      "redirect_uri_mismat",
      "access_denie",
      "invalid_reque",
      "slow_downss",
      "authorization_pendig",
      "login_requiredsss",
      "interaction_requiredsss",
      "consent_requiredsss",
      "access_deniedsss",
      "invalid_grantsst",
      "interaction_requiredd",
      "temporarily_unavailablesss",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional triple-suffix and glued-grant OAuth misspellings without error_description", async () => {
    for (const error of [
      "unsupported_granttype",
      "unsupported_granttypes",
      "unsupported_grant_typeos",
      "invalid_requestss",
      "invalid_requestts",
      "access_deniedss",
      "invalid_granttss",
      "redirect_uri_mismatchss",
      "login_requiredss",
      "interaction_requiredss",
      "consent_requiredss",
      "authorization_pendingss",
      "temporarily_unavailabless",
      "insufficient_scopesss",
      "server_errorsss",
      "invalid_clientsss",
      "login_requir",
      "interaction_requir",
      "consent_requir",
      "temporarily_unavailab",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional double-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "invalid_grent",
      "invalid_graint",
      "unsupported_responsetype",
      "unsupported_response_typeo",
      "redirect_uri_mismatchs",
      "login_requireds",
      "interaction_requireds",
      "consent_requireds",
      "authorization_pendings",
      "temporarily_unavailables",
      "insufficient_scopees",
      "server_errorss",
      "invalid_clientss",
      "unauthorized_clientss",
      "access_denideedd",
      "unsupported_responnse_typ",
      "redirect_uri_msimtchs",
      "login_requiress",
      "interaction_requiress",
      "consent_requiress",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional plural-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "access_denieds",
      "invalid_grandt",
      "invalid_grants",
      "unsupported_responnse_type",
      "redirect_uri_msimtch",
      "login_require",
      "interaction_require",
      "consent_require",
      "authorization_pend",
      "temporariliy_unavailable",
      "insufficient_scoe",
      "invalid_scoe",
      "server_erro",
      "slow_do",
      "invalid_clie",
      "unauthorized_clie",
      "unsupported_responce_tyoe",
      "invalid_granitt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional clipped-token OAuth misspellings without error_description", async () => {
    for (const error of [
      "access_denieded",
      "acees_denied",
      "invalid_granit",
      "invalid_grunt",
      "redirect_uri_mismatc",
      "redirect_uri_msmatch",
      "login_requied",
      "interaction_requied",
      "consent_requied",
      "authoriztion_pending",
      "temporarilly_unavailable",
      "insufficent_scop",
      "sserver_error",
      "slow_ddwn",
      "access_deneyd",
      "unsupported_grant_tpe",
      "conset_required",
      "interacton_reqired",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional extra-echo OAuth misspellings without error_description", async () => {
    for (const error of [
      "aceess_denied",
      "acceess_denied",
      "invalid_granat",
      "unsupported_respons_type",
      "unsupported_response_tpyo",
      "unsupported_grant_tpyo",
      "redirect_uri_misamatch",
      "login_reqiured",
      "authorization_peniding",
      "temporarily_unavail",
      "insufficient_scopee",
      "slow_doowm",
      "invalid_clietnt",
      "access_denideed",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional truncated-suffix OAuth misspellings without error_description", async () => {
    for (const error of [
      "aces_denied",
      "invalid_grantt",
      "invalid_requestt",
      "unsupported_respnse_type",
      "unsupported_respose_type",
      "unsupported_grant_tyoe",
      "redirect_uri_mistmach",
      "loging_required",
      "interaction_reqiured",
      "consent_reqiured",
      "authorization_pendin",
      "insufficient_scoep",
      "invalid_scoep",
      "serveer_error",
      "slow_doown",
      "invalide_request",
      "invalide_client",
      "invalide_token",
      "unsupported_response_tyoe",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional omitted-vowel OAuth misspellings without error_description", async () => {
    for (const error of [
      "access_deneid",
      "invalid_gratt",
      "invalid_requuest",
      "unsupported_respone_type",
      "redirect_uri_mimatch",
      "login_requird",
      "interaction_requird",
      "consent_requird",
      "authorizaton_pending",
      "temporarily_unavaiable",
      "insufficient_scopt",
      "invalid_scopt",
      "access_denayed",
      "invalid_graunt",
      "redirect_uri_mistmatch",
      "login_requiredd",
      "consent_requiredd",
      "server_errorr",
      "invalide_grant",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional adjacent-key OAuth misspellings without error_description", async () => {
    for (const error of [
      "invalid_grand",
      "invalid_grund",
      "invalid_reqeust",
      "invalid_rquest",
      "unsupported_response_tpye",
      "unsupported_grand_type",
      "redirect_uri_msimatch",
      "loggin_required",
      "interaction_reuired",
      "authorization_penidng",
      "temporarily_unavaliable",
      "insufficient_scpoe",
      "invalid_scpoe",
      "slow_downw",
      "invalid_clietn",
      "expired_tiken",
      "invalid_tiken",
      "access_denidee",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside keyboard-transposition OAuth misspellings without error_description", async () => {
    for (const error of [
      "acccess_denied",
      "invalid_grtant",
      "invalid_reauest",
      "unsupported_repsonse_type",
      "unsupported_grnat_type",
      "loign_required",
      "intearction_required",
      "consnet_required",
      "authroization_pending",
      "temproarily_unavailable",
      "insufficinet_scope",
      "invaldi_scope",
      "sever_error",
      "slow_dnow",
      "invalid_clien",
      "unauthorized_cleint",
      "expired_tokem",
      "invalid_tokem",
      "unsupported_responce_tpye",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional vowel-swap OAuth misspellings without error_description", async () => {
    for (const error of [
      "accesss_denied",
      "access_deined",
      "invaild_grant",
      "invalid_grnat",
      "invalid_reuqest",
      "unsported_response_type",
      "unsupported_grent_type",
      "redirect_uri_missmatch",
      "insufficeint_scope",
      "temporarily_unavailale",
      "authorization_peding",
      "interation_required",
      "consent_requeired",
      "invalid_cleint",
      "unathorized_client",
      "expire_token",
      "invald_token",
      "slown_down",
      "invalid_grantt",
      "unsupported_responce_tyep",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|interaction|pending|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside dropped-letter and transposed OAuth misspellings without error_description", async () => {
    for (const error of [
      "acess_denied",
      "access_dened",
      "invald_grant",
      "invalid_gant",
      "servr_error",
      "temporary_unavailable",
      "insufficient_scpe",
      "invalid_scopee",
      "unsupported_response_tpe",
      "redirect_uri_mismtach",
      "logn_required",
      "consent_requireed",
      "slow_dowm",
      "invalid_requesst",
      "unsupported_grant_tyep",
      "unsupported_token_tyep",
      "unauthorized_clinet",
      "invalid_clinet",
      "expired_tokne",
      "invalid_tokne",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|consent|sign-in|server|temporary|scope|permission|redirect|response|slow|client|token|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside additional trailing-letter OAuth misspellings without error_description", async () => {
    for (const error of [
      "acces_denied",
      "access_deniedd",
      "invalid_reqest",
      "unsupported_grant_tipe",
      "interactoin_required",
      "concent_required",
      "expired_tokken",
      "invalid_tokken",
      "insufficent_scope",
      "unsupported_responce_typee",
      "redirect_uri_mismatchh",
      "login_requireed",
      "interaction_requireed",
      "authorization_pendding",
      "temporarily_unavailablee",
      "invalid_grrant",
      "unsupported_grrant_type",
      "unauthorized_clientt",
      "invalid_clientt",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /access|canceled|invalid|grant|interaction|consent|expired|token|scope|redirect|response|sign-in|pending|temporary|client|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph server_error with cyrillic ё and additional OAuth double-letter misspellings without error_description", async () => {
    for (const error of [
      "server_er\u0451ror",
      "slow_do\u043en",
      "consent_requirred",
      "login_requirred",
      "interaction_requirred",
      "authorization_pendinng",
      "invalid_graant",
      "access_denide",
      "server_erorr",
      "temporarily_unavailible",
      "insufficient_scoop",
      "redirect_uri_mismachh",
      "invalid_grannt",
      "login_requried",
      "consent_requried",
      "slow_downn",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /server|slow|consent|sign-in|interaction|pending|grant|access|canceled|temporary|scope|redirect|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph invalid_grant with cyrillic я and additional required/pending misspellings without error_description", async () => {
    for (const error of [
      "invalid_gr\u044fnt",
      "login_reqired",
      "interaction_reqired",
      "authorization_pendingg",
      "redirect_uri_mismtch",
    ]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /invalid grant|sign-in|interaction|pending|redirect|identity provider|complete response/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph slow_down and additional OAuth misspellings without error_description", async () => {
    for (const error of ["slow_do\u0448n", "access_denid", "temporarily_unavailabe"]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(
        /slow|access|canceled|temporary|identity provider|complete response|sign-in/i,
      );
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph redirect_uri_mismatch without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "redirec\u0442_uri_mismatch",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/redirect|identity provider|complete response/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph invalid_token without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "invalid_\u0442oken",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/token|identity provider|complete response/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph authorization_pending without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "authori\u0437ation_pending",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/identity provider|complete response|pending/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph unsupported_grant_type without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "unsupported_\u0433rant_type",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/grant type|identity provider|complete response/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph invalid_grant with cyrillic б without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "inval\u0431d_grant",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/invalid grant|identity provider|complete response/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph server_error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "server_er\u0440or",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/identity provider|server error|complete response/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside homoglyph invalid_grant error without error_description", async () => {
    for (const error of ["ınvalid_grant", "іnvalid_grant", "invalid_gra\u03bdt"]) {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            access_token: "access-1",
            error,
          }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      await expect(
        exchangeAuthorizationCode({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          code: "auth-code",
          redirectUri: "https://app.example/callback",
          codeVerifier: "verifier",
        }),
      ).rejects.toThrow(/invalid grant|complete response from your identity provider/i);
    }
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside fullwidth invalid_grant error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "ｉｎｖａｌｉｄ_ｇｒａｎｔ",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/invalid grant|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside unicode infinity symbol error without error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "∞",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside fullwidth numeric-string error and readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "４０３",
          error_description: "Forbidden",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Forbidden|complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside invisible-format-char-prefixed snake_case object_map error metadata", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "\u200bobject_map",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside underscore-normalized object-coercion error metadata", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "[object_array]",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside object-coercion error metadata", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "[object Object]",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside usable error_uri without error", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error_uri: "https://idp.example/errors/1",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside hollow error and object-coercion error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error: "",
          error_description: "[object Object]",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside object-coercion error_description without error", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error_description: "[object Object]",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside readable error_description without error", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error_description: "Policy denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/Policy denied/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside readable error_description and object-coercion error_uri", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error_uri: "[object Object]",
          error_description: "Policy denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider|Policy denied/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside readable error_description and placeholder error_uri", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error_uri: "null",
          error_description: "Policy denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider|Policy denied/i);
  });

  it("rejects a successful HTTP 200 token response when access_token is present alongside readable error_description and hollow error_uri", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error_uri: "   ",
          error_description: "Policy denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider|Policy denied/i);
  });

  it("rejects a successful HTTP 200 token response when usable error_uri and readable error_description are present without error", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          error_uri: "https://idp.example/errors/1",
          error_description: "Optional notice",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      }),
    ).rejects.toThrow(/complete response from your identity provider/i);
  });

  it("surfaces incomplete IdP copy when token JSON has only whitespace error_uri", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_uri: "   " }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON has error_uri and error_description without error", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error_uri: "https://idp.example/errors/1",
          error_description: "Policy denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toContain("Policy denied");
  });

  it("surfaces incomplete IdP copy when token JSON has only placeholder error_description string", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_description: "[]" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toContain("[]");
  });

  it("surfaces incomplete IdP copy when token JSON error is numeric with readable error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 403, error_description: "Forbidden" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toContain("Forbidden");
  });

  it("surfaces incomplete IdP copy when token JSON has only whitespace error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_description: "   " }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error is whitespace-only but error_description is readable", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "   ", error_description: "The authorization code expired" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toContain("authorization code expired");
  });

  it("surfaces incomplete IdP copy when token JSON error is an array but error_description is readable", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: [], error_description: "The authorization code expired" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toContain("authorization code expired");
  });

  it("surfaces incomplete IdP copy when token JSON error is the literal false string", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "false" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/false/i);
  });

  it("surfaces incomplete IdP copy when token JSON error_description is the literal NaN string only", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_description: "NaN" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/NaN/i);
  });

  it("surfaces incomplete IdP copy when token JSON error_description is the literal null string only", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_description: "null" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/^null$/i);
  });

  it("surfaces incomplete IdP copy when token JSON error is the literal null string", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "null" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/^null$/i);
  });

  it("surfaces incomplete IdP copy when token JSON error_description is explicit null only", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_description: null }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
  });

  it("surfaces incomplete IdP copy when token JSON error is explicit null", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: null }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error_description is a boolean OAuth field", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_description: false }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
  });

  it("surfaces incomplete IdP copy when token JSON error is a boolean OAuth field", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: true }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error is a non-string OAuth field", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 403 }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error and error_description are both numeric", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 403, error_description: 500 }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("surfaces incomplete IdP copy when token JSON error_description collapses to empty after normalization", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_description: "\u0007" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await exchangeAuthorizationCode({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        code: "auth-code",
        redirectUri: "https://app.example/callback",
        codeVerifier: "verifier",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).message).toMatch(
      /We did not receive a complete response from your identity provider/i,
    );
    expect((caught as OAuthTokenEndpointError).message).not.toMatch(/Token endpoint error 400/i);
  });

  it("humanizes invalid_token refresh grant errors instead of raw snake_case", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_token",
          error_description: "Token expired",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/invalid token: Token expired/);
  });

  it("humanizes expired_token refresh grant errors instead of raw snake_case", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "expired_token" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/Sign-in did not finish \(expired token\)/i);
  });

  it("does not mark authorize callback failed when refresh token exchange fails", async () => {
    sessionStorage.clear();

    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "invalid_grant" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/Sign-in did not finish \(invalid grant\)/i);

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("classifies humanized invalid_grant refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "invalid_grant" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).message).not.toContain("invalid_grant");
  });

  it("classifies humanized unauthorized_client refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ error: "unauthorized_client" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("unauthorized_client");
    expect((caught as OAuthTokenEndpointError).message).not.toContain("unauthorized_client");
  });

  it("classifies humanized invalid_client refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: "invalid_client" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).message).not.toContain("invalid_client");
  });

  it("classifies humanized unauthorized_client refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "unauthorized_client" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("unauthorized_client");
    expect((caught as OAuthTokenEndpointError).message).not.toContain("unauthorized_client");
  });

  it("classifies humanized invalid_request and redirect_uri_mismatch refresh failures for BFF session clearing", async () => {
    for (const errorCode of ["invalid_request", "redirect_uri_mismatch"] as const) {
      const fetchMock = vi.fn(async () => ({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: errorCode }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      let caught: unknown;

      try {
        await refreshAccessToken({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          refreshToken: "rt",
        });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
      expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
      expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe(errorCode);
      expect((caught as OAuthTokenEndpointError).message).not.toContain(errorCode);
    }
  });

  it("classifies humanized login_required refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "login_required" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("login_required");
    expect((caught as OAuthTokenEndpointError).message).not.toContain("login_required");
  });

  it("classifies humanized interaction_required and consent_required refresh failures for BFF session clearing", async () => {
    for (const errorCode of ["interaction_required", "consent_required"] as const) {
      const fetchMock = vi.fn(async () => ({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: errorCode }),
      }));

      vi.stubGlobal("fetch", fetchMock);

      let caught: unknown;

      try {
        await refreshAccessToken({
          tokenEndpoint: "https://login.example.com/token",
          clientId: "client",
          refreshToken: "rt",
        });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
      expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
      expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe(errorCode);
      expect((caught as OAuthTokenEndpointError).message).not.toContain(errorCode);
    }
  });

  it("classifies humanized access_denied refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "access_denied" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("access_denied");
    expect((caught as OAuthTokenEndpointError).message).not.toContain("access_denied");
  });

  it("classifies humanized invalid_scope refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "invalid_scope" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("invalid_scope");
    expect((caught as OAuthTokenEndpointError).message).not.toContain("invalid_scope");
  });

  it("classifies humanized access_denied refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "access_denied" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).message).toMatch(/canceled sign-in/i);
    expect((caught as OAuthTokenEndpointError).message).not.toContain("access_denied");
  });

  it("does not classify transient server_error refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 503,
      text: async () => JSON.stringify({ error: "server_error" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(false);
  });

  it("does not classify transient slow_down refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "slow_down" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(false);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("slow_down");
  });

  it("does not classify transient authorization_pending refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "authorization_pending" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(false);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("authorization_pending");
  });

  it("classifies humanized expired_token refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "expired_token" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("expired_token");
    expect((caught as OAuthTokenEndpointError).message).not.toContain("expired_token");
  });

  it("classifies legacy Error messages that embed readable snake_case OAuth codes for BFF session clearing", () => {
    expect(isOAuthRefreshTokenRejectedError(new Error("unsupported_grant_type"))).toBe(true);
    expect(isOAuthRefreshTokenRejectedError(new Error("unsupported_response_type"))).toBe(true);
    expect(isOAuthRefreshTokenRejectedError(new Error("token refresh failed: invalid_grant"))).toBe(
      true,
    );
    expect(
      isOAuthRefreshTokenRejectedError(new Error("token refresh failed: unsupported_grant_type")),
    ).toBe(true);
  });

  it("does not classify legacy Error messages that embed transient snake_case OAuth codes", () => {
    expect(isOAuthRefreshTokenRejectedError(new Error("server_error"))).toBe(false);
    expect(isOAuthRefreshTokenRejectedError(new Error("temporarily_unavailable"))).toBe(false);
  });

  it("does not classify legacy Error messages with only humanized copy and no snake_case codes", () => {
    expect(
      isOAuthRefreshTokenRejectedError(
        new Error("Your identity provider reported a temporary error. Wait a minute and try signing in again."),
      ),
    ).toBe(false);
  });

  it("classifies unsupported_response_type refresh failures via readable OAuth code policy", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "unsupported_response_type" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("unsupported_response_type");
    expect((caught as OAuthTokenEndpointError).message).not.toContain("unsupported_response_type");
  });

  it("classifies humanized unsupported_token_type refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "unsupported_token_type" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("unsupported_token_type");
    expect((caught as OAuthTokenEndpointError).message).not.toContain("unsupported_token_type");
  });

  it("classifies humanized unsupported_grant_type refresh failures for BFF session clearing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "unsupported_grant_type" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("unsupported_grant_type");
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
    expect((caught as OAuthTokenEndpointError).message).not.toContain("unsupported_grant_type");
  });

  it("does not classify humanized server_error refresh failures as permanent rejection", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "server_error" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("server_error");
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(false);
  });

  it("does not classify humanized temporarily_unavailable refresh failures as permanent rejection", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "temporarily_unavailable" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("temporarily_unavailable");
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(false);
  });

  it("classifies invalid_token refresh failures even when message is humanized", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "invalid_token" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    let caught: unknown;

    try {
      await refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(OAuthTokenEndpointError);
    expect((caught as OAuthTokenEndpointError).normalizedErrorCode).toBe("invalid_token");
    expect(isOAuthRefreshTokenRejectedError(caught)).toBe(true);
  });

  it("posts authorization code grants to token endpoints that include required query parameters (B2C policy)", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ access_token: "access-1", token_type: "Bearer" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokenEndpoint =
      "https://contoso.b2clogin.com/contoso.onmicrosoft.com/B2C_1_signin/oauth2/v2.0/token?p=B2C_1_signin";

    await exchangeAuthorizationCode({
      tokenEndpoint,
      clientId: "client",
      code: "auth-code",
      redirectUri: "https://app.example/callback",
      codeVerifier: "verifier",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      tokenEndpoint,
      expect.objectContaining({ method: "POST" }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as { body?: URLSearchParams };
    const posted = new URLSearchParams(requestInit.body);

    expect(posted.get("grant_type")).toBe("authorization_code");
    expect(posted.get("code")).toBe("auth-code");
  });

  it("posts to token endpoints that include required query parameters (B2C policy)", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ access_token: "access-1", token_type: "Bearer" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await refreshAccessToken({
      tokenEndpoint:
        "https://contoso.b2clogin.com/contoso.onmicrosoft.com/B2C_1_signin/oauth2/v2.0/token?p=B2C_1_signin",
      clientId: "client",
      refreshToken: "rt",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://contoso.b2clogin.com/contoso.onmicrosoft.com/B2C_1_signin/oauth2/v2.0/token?p=B2C_1_signin",
      expect.objectContaining({ method: "POST" }),
    );
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

  it("throws when HTTP 200 OAuth JSON includes only error_description", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ error_description: "hint only" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/hint only/i);
  });

  it("trims caller-supplied refresh token values before posting the form", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ access_token: "access-1" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await refreshAccessToken({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      refreshToken: "  refresh-1  ",
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as { body?: URLSearchParams };
    const posted = new URLSearchParams(requestInit.body);

    expect(posted.get("refresh_token")).toBe("refresh-1");
  });

  it("trims padded client_id values before posting the form", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ access_token: "access-1" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await refreshAccessToken({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "  client-1  ",
      refreshToken: "rt",
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as { body?: URLSearchParams };
    const posted = new URLSearchParams(requestInit.body);

    expect(posted.get("client_id")).toBe("client-1");
  });

  it("surfaces incomplete IdP copy when token JSON error is numeric and error_description is non-string", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 403, error_description: true }),
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

    expect(message).toMatch(/We did not receive a complete response from your identity provider/i);
    expect(message).not.toMatch(/token endpoint error 400/i);
    expect(message).not.toMatch(/403: true/i);
  });

  it("uses fixed consent_required copy from token JSON even when error_description is present", async () => {
    const oversized = `${"Policy ".repeat(80)}end`;
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "consent_required",
          error_description: oversized,
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

    expect(message).toContain("administrator consent");
    expect(message).not.toContain("Policy");
    expect(message.length).toBeLessThanOrEqual(280);
  });

  it("humanizes percent-encoded plus glue in token JSON error codes like authorize callbacks", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "unauthorized%2Bclient" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/not enabled/i);
  });

  it("humanizes standard OAuth error codes from token endpoint JSON like authorize callbacks", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "access_denied" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/canceled sign-in/i);
  });

  it("preserves literal percent signs in JSON error_description on token responses", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant",
          error_description: "100% failed",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/^invalid grant: 100% failed$/);
  });

  it("does not treat plus as space in JSON error_description on token responses", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant",
          error_description: "User+denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/^invalid grant: User\+denied$/);
  });

  it("preserves OAuth error codes when JSON error field contains a soft hyphen", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid\u00ADgrant",
          error_description: "Session expired",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/^invalid grant: Session expired$/);
  });

  it("surfaces regional-indicator flag emoji from JSON error_description on token responses", async () => {
    const detail = "🇺🇸";
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant",
          error_description: detail,
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/^invalid grant: 🇺🇸$/u);
  });

  it("surfaces emoji ZWJ sequences from JSON error_description on token responses", async () => {
    const detail = "👨\u200d👩\u200d👧";
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant",
          error_description: detail,
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(new RegExp(`invalid grant: ${detail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  });

  it("preserves OAuth error codes when JSON error field contains interior zero-width characters", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid\u200bgrant",
          error_description: "Session expired",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/^invalid grant: Session expired$/);
  });

  it("collapses interior zero-width characters in JSON error_description on token responses", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant",
          error_description: "Policy\u200bdenied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/^invalid grant: Policy denied$/);
  });

  it("decodes percent-encoded OAuth error_description fields from JSON token responses", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant",
          error_description: "User%20denied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/^invalid grant: User denied$/);
  });

  it("collapses soft hyphens in token endpoint OAuth error descriptions", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant",
          error_description: "Policy\u00ADdenied",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/^invalid grant: Policy denied$/);
  });

  it("surfaces incomplete IdP copy when token JSON error is underscore-only but error_description is readable", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "___", error_description: "Session expired" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/We did not receive a complete response from your identity provider/i);
  });

  it("surfaces numeric-string OAuth error codes on token endpoint errors", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "403", error_description: "Forbidden" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/^403: Forbidden$/);
  });

  it("omits hyphen-only OAuth error_description values on token endpoint errors", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "invalid_grant", error_description: "---" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/Sign-in did not finish \(invalid grant\)/i);
  });

  it("ignores invisible-only OAuth error_description values on token endpoint errors", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "invalid_grant", error_description: "\u2060" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/Sign-in did not finish \(invalid grant\)/i);
  });

  it("uses only string OAuth error fields when token JSON mixes types", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ error: "invalid_grant", error_description: 123 }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/Sign-in did not finish \(invalid grant\)/i);
  });

  it("trims authorization code and PKCE fields before posting the form", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ access_token: "access-1" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: "  auth-code  ",
      redirectUri: "  https://app.example/callback  ",
      codeVerifier: "  verifier  ",
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as { body?: URLSearchParams };
    const posted = new URLSearchParams(requestInit.body);

    expect(posted.get("code")).toBe("auth-code");
    expect(posted.get("redirect_uri")).toBe("https://app.example/callback");
    expect(posted.get("code_verifier")).toBe("verifier");
  });

  it("strips zero-width characters from authorization code and PKCE fields before posting the form", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ access_token: "access-1" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await exchangeAuthorizationCode({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      code: `\u200bauth-code\u200b`,
      redirectUri: `https://app.example/callback`,
      codeVerifier: `\u200bverifier\u200b`,
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as { body?: URLSearchParams };
    const posted = new URLSearchParams(requestInit.body);

    expect(posted.get("code")).toBe("auth-code");
    expect(posted.get("code_verifier")).toBe("verifier");
  });

  it("omits whitespace-only refresh_token values from token responses", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          refresh_token: "   ",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await refreshAccessToken({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      refreshToken: "rt",
    });

    expect(tokens.refresh_token).toBeUndefined();
  });

  it("omits whitespace-only id_token values from token responses", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          id_token: "   ",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await refreshAccessToken({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      refreshToken: "rt",
    });

    expect(tokens.id_token).toBeUndefined();
  });

  it("omits zero-width-only refresh_token values from token responses", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          refresh_token: "\u200b",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await refreshAccessToken({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      refreshToken: "rt",
    });

    expect(tokens.refresh_token).toBeUndefined();
  });

  it("truncates oversized OAuth error descriptions from the token endpoint", async () => {
    const oversized = `${"expired ".repeat(80)}done`;
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "invalid_grant",
          error_description: oversized,
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

    expect(message.length).toBeLessThanOrEqual(320);
    expect(message.endsWith("…")).toBe(true);
  });

  it("trims surrounding whitespace from optional refresh_token and id_token fields", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          access_token: "access-1",
          refresh_token: "  refresh-1  ",
          id_token: "  id-1  ",
        }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const tokens = await refreshAccessToken({
      tokenEndpoint: "https://login.example.com/token",
      clientId: "client",
      refreshToken: "rt",
    });

    expect(tokens.refresh_token).toBe("refresh-1");
    expect(tokens.id_token).toBe("id-1");
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

    expect(message).toBe("invalid grant: expired injected");
    expect(message).not.toMatch(/\r|\n/u);
  });

  it("throws when the token endpoint returns an empty success body", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => "",
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshAccessToken({
        tokenEndpoint: "https://login.example.com/token",
        clientId: "client",
        refreshToken: "rt",
      }),
    ).rejects.toThrow(/not valid JSON/i);
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
    ).rejects.toThrow(/invalid grant: refresh token expired/);
  });
});
