import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as bffSessionSync from "@/lib/oidc/bff-session-sync";
import {
  clearOidcSession,
  consumeAuthorizeCallbackFailedRetry,
  markAuthorizeCallbackFailed,
  consumePkceState,
  consumePostSignInReturnUrl,
  getAccessTokenExpiresAtMs,
  getAccessTokenForApi,
  isLikelySignedIn,
  persistTokenResponse,
  readAuthorizeRetryReturnPathSnapshot,
  readPostSignInReturnUrl,
  readSignedInDisplayName,
  readSignedInUserSubject,
  storePkceState,
  storePostSignInReturnUrl,
} from "@/lib/oidc/session";
import {
  OIDC_ACCESS_TOKEN_KEY,
  OIDC_DISPLAY_NAME_KEY,
  OIDC_EXPIRES_AT_MS_KEY,
  OIDC_ID_TOKEN_KEY,
  OIDC_AUTHORIZE_CALLBACK_FAILED_KEY,
  OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY,
  OIDC_POST_SIGN_IN_RETURN_URL_KEY,
  OIDC_REFRESH_TOKEN_KEY,
  OIDC_USER_SUBJECT_KEY,
} from "@/lib/oidc/storage-keys";

function accessTokenWithSubjectClaim(sub: string = "user-test"): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub })).toString("base64url");

  return `${header}.${payload}.sig`;
}

describe("storePostSignInReturnUrl / consumePostSignInReturnUrl", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("round-trips a safe local path", () => {
    storePostSignInReturnUrl("/architecture/reviews/123");

    expect(consumePostSignInReturnUrl()).toBe("/architecture/reviews/123");
  });

  it("strips zero-width characters from stored post-sign-in return paths", () => {
    storePostSignInReturnUrl("/architecture\u200b/reviews/123");

    expect(consumePostSignInReturnUrl()).toBe("/architecture/reviews/123");
  });

  it("is single-use — consuming twice returns null the second time", () => {
    storePostSignInReturnUrl("/architecture/reviews/123");
    consumePostSignInReturnUrl();

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("returns null when nothing was ever stored", () => {
    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("does not store an absolute external URL", () => {
    storePostSignInReturnUrl("https://evil.example/phish");

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("returns null when legacy post-sign-in return path is zero-width-only", () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "\u200b\u200b");

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("drops a zero-width-only return URL from sessionStorage on read without clearing authorize retry marker", () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "\u200b\u200b");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

    expect(readPostSignInReturnUrl()).toBeNull();
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("returns the same safe post-sign-in return path on repeated read without clearing storage", () => {
    storePostSignInReturnUrl("/architecture/reviews/run-keep");

    expect(readPostSignInReturnUrl()).toBe("/architecture/reviews/run-keep");
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-keep");
    expect(readPostSignInReturnUrl()).toBe("/architecture/reviews/run-keep");
  });

  it("keeps authorize retry marker when consume rejects a zero-width-only return URL", () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "\u200b\u200b");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

    expect(consumePostSignInReturnUrl()).toBeNull();
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("does not store a protocol-relative URL", () => {
    storePostSignInReturnUrl("//evil.example");

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("does not store a javascript: URL", () => {
    storePostSignInReturnUrl("javascript:alert(1)");

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("does not store a backslash-prefixed URL", () => {
    storePostSignInReturnUrl("/\\evil.example");

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("drops a tampered absolute return URL from sessionStorage without clearing authorize retry marker", () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

    expect(readPostSignInReturnUrl()).toBeNull();
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("keeps authorize retry marker when consume rejects a tampered unsafe return URL", () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

    expect(consumePostSignInReturnUrl()).toBeNull();
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("keeps authorize-retry return snapshot when consume rejects a tampered unsafe return URL", () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");
    sessionStorage.setItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY, "/architecture/reviews/safe-snapshot");

    expect(consumePostSignInReturnUrl()).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY)).toBe(
      "/architecture/reviews/safe-snapshot",
    );
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("does not write authorize-retry return snapshot when post-sign-in URL is absent", () => {
    markAuthorizeCallbackFailed();

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("drops a zero-width-only authorize-retry return snapshot on read", () => {
    sessionStorage.setItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY, "\u200b\u200b");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

    expect(readAuthorizeRetryReturnPathSnapshot()).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("captures safe post-sign-in return path when authorize callback retry is marked", () => {
    storePostSignInReturnUrl("/architecture/reviews/run-snapshot");
    markAuthorizeCallbackFailed();

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY)).toBe("/architecture/reviews/run-snapshot");
  });
});

describe("getAccessTokenForApi / isLikelySignedIn expiry parsing (LK-06 P2)", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("never exposes access tokens from sessionStorage after sign-in", () => {
    persistTokenResponse({ access_token: accessTokenWithSubjectClaim(), expires_in: 3600 });

    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_REFRESH_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_ID_TOKEN_KEY)).toBeNull();
    expect(getAccessTokenForApi()).toBeUndefined();
  });

  it("treats a non-numeric expires_at as expired instead of bypassing skew checks", () => {
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, "not-a-number");

    expect(getAccessTokenForApi()).toBeUndefined();
    expect(isLikelySignedIn()).toBe(false);
  });

  it("parses expires_at_ms session hints after stripping zero-width padding", () => {
    const futureMs = Date.now() + 3_600_000;
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, `${futureMs}\u200b`);
    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-123");

    expect(isLikelySignedIn()).toBe(true);
  });

  it("does not treat a future expires_at_ms hint alone as signed in", () => {
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now() + 3_600_000));

    expect(isLikelySignedIn()).toBe(false);
    expect(getAccessTokenExpiresAtMs()).toBe(0);
  });

  it("treats identity hints as signed in until expires_at_ms even inside the refresh skew window", () => {
    sessionStorage.setItem(OIDC_DISPLAY_NAME_KEY, "Jane Operator");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now() + 45_000));

    expect(isLikelySignedIn()).toBe(true);
  });

  it("returns zero expiry for consumers when identity hints are missing", () => {
    const futureMs = Date.now() + 3_600_000;
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(futureMs));
    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-123");

    expect(getAccessTokenExpiresAtMs()).toBe(futureMs);

    sessionStorage.removeItem(OIDC_USER_SUBJECT_KEY);
    sessionStorage.removeItem(OIDC_DISPLAY_NAME_KEY);

    expect(getAccessTokenExpiresAtMs()).toBe(0);
  });

  it("treats scientific-notation expires_at_ms session hints in the past as expired", () => {
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, "1.73e12");

    expect(isLikelySignedIn()).toBe(false);
  });

  it("does not merge digits around interior zero-width characters in expires_at_ms hints", () => {
    const futureMs = Date.now() + 3_600_000;
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, `${futureMs}\u200b000`);

    expect(isLikelySignedIn()).toBe(false);
  });

  it("treats zero-width-only expires_at_ms session hints as expired", () => {
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, "\u200b\u200b");

    expect(isLikelySignedIn()).toBe(false);
    expect(getAccessTokenForApi()).toBeUndefined();
  });

  it("treats comma-grouped expires_at_ms session hints as expired", () => {
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, "1,730,000,000,000");

    expect(isLikelySignedIn()).toBe(false);
    expect(getAccessTokenForApi()).toBeUndefined();
  });

  it("treats small hex expires_at_ms session hints as expired", () => {
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, "0x1234");

    expect(isLikelySignedIn()).toBe(false);
    expect(getAccessTokenForApi()).toBeUndefined();
  });

  it("treats binary-prefixed expires_at_ms session hints as expired", () => {
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, "0b101");

    expect(isLikelySignedIn()).toBe(false);
    expect(getAccessTokenForApi()).toBeUndefined();
  });

  it("treats hex-prefixed future expires_at_ms session hints as expired", () => {
    const futureMs = Date.now() + 3_600_000;
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, `0x${futureMs.toString(16)}`);

    expect(isLikelySignedIn()).toBe(false);
    expect(getAccessTokenForApi()).toBeUndefined();
  });

  it("treats octal-prefixed expires_at_ms session hints as expired", () => {
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, "0o123");

    expect(isLikelySignedIn()).toBe(false);
    expect(getAccessTokenForApi()).toBeUndefined();
  });

  it("treats expires_at_ms session hints above MAX_SAFE_INTEGER as expired", () => {
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Number.MAX_SAFE_INTEGER + 1));

    expect(isLikelySignedIn()).toBe(false);
    expect(getAccessTokenForApi()).toBeUndefined();
  });
});

describe("persistTokenResponse", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("treats empty array expires_in as the default lifetime instead of immediate expiry", () => {
    persistTokenResponse({ access_token: accessTokenWithSubjectClaim(), expires_in: [] as unknown as number });

    const expiresAtMs = Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY));

    expect(expiresAtMs).toBeGreaterThan(Date.now() + 3_000_000);
  });

  it("treats negative expires_in as the default lifetime instead of writing a past expiry", () => {
    persistTokenResponse({ access_token: accessTokenWithSubjectClaim(), expires_in: -120 });

    const expiresAtMs = Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY));

    expect(Number.isFinite(expiresAtMs)).toBe(true);
    expect(expiresAtMs).toBeGreaterThan(Date.now());
    expect(isLikelySignedIn()).toBe(true);
    expect(getAccessTokenForApi()).toBeUndefined();
    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBeNull();
  });

  it("honors zero expires_in so callers refresh immediately", () => {
    persistTokenResponse({ access_token: accessTokenWithSubjectClaim(), expires_in: 0 });

    expect(getAccessTokenForApi()).toBeUndefined();
    expect(isLikelySignedIn()).toBe(false);
  });

  it("rejects a token response with a missing access_token instead of persisting the literal string undefined", () => {
    expect(() =>
      persistTokenResponse({ access_token: undefined as unknown as string, expires_in: 3600 }),
    ).toThrow(/access_token/i);

    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBeNull();
    expect(isLikelySignedIn()).toBe(false);
    expect(getAccessTokenForApi()).toBeUndefined();
  });

  it("rejects zero-width-only access_token values instead of writing partial session hints", () => {
    expect(() => persistTokenResponse({ access_token: "\u200b", expires_in: 3600 })).toThrow(
      /access_token/i,
    );

    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBeNull();
    expect(isLikelySignedIn()).toBe(false);
  });

  it("maps boolean false expires_in from malformed token JSON to the default lifetime", () => {
    persistTokenResponse({
      access_token: accessTokenWithSubjectClaim(),
      expires_in: false as unknown as number,
    });

    const expiresAtMs = Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY));
    const expectedMin = Date.now() + 3590 * 1000;
    const expectedMax = Date.now() + 3610 * 1000;

    expect(expiresAtMs).toBeGreaterThanOrEqual(expectedMin);
    expect(expiresAtMs).toBeLessThanOrEqual(expectedMax);
    expect(isLikelySignedIn()).toBe(true);
  });

  it("maps boolean expires_in from malformed token JSON to the default lifetime", () => {
    persistTokenResponse({
      access_token: accessTokenWithSubjectClaim(),
      expires_in: true as unknown as number,
    });

    const expiresAtMs = Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY));
    const expectedMin = Date.now() + 3590 * 1000;
    const expectedMax = Date.now() + 3610 * 1000;

    expect(expiresAtMs).toBeGreaterThanOrEqual(expectedMin);
    expect(expiresAtMs).toBeLessThanOrEqual(expectedMax);
    expect(isLikelySignedIn()).toBe(true);
  });

  it("coerces string expires_in from the token response before writing expiry", () => {
    persistTokenResponse({
      access_token: accessTokenWithSubjectClaim(),
      expires_in: "7200" as unknown as number,
    });

    const expiresAtMs = Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY));
    const expectedMin = Date.now() + 7190 * 1000;
    const expectedMax = Date.now() + 7210 * 1000;

    expect(expiresAtMs).toBeGreaterThanOrEqual(expectedMin);
    expect(expiresAtMs).toBeLessThanOrEqual(expectedMax);
    expect(isLikelySignedIn()).toBe(true);
    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBeNull();
  });

  it("truncates fractional expires_in to whole seconds (parity with bff-session-sync)", () => {
    const before = Date.now();
    persistTokenResponse({ access_token: accessTokenWithSubjectClaim(), expires_in: 10.9 });

    const expiresAtMs = Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY));
    const elapsedMs = expiresAtMs - before;

    expect(elapsedMs).toBeGreaterThanOrEqual(9_990);
    expect(elapsedMs).toBeLessThanOrEqual(10_010);
  });

  it("clears the BFF cookie again when sign-out runs while token sync is in flight", async () => {
    let releaseSync: (() => void) | undefined;

    vi.spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseSync = () => {
            resolve();
          };
        }),
    );
    vi.spyOn(bffSessionSync, "clearBffSessionCookie").mockResolvedValue();

    persistTokenResponse({ access_token: accessTokenWithSubjectClaim(), expires_in: 3600 });
    await Promise.resolve();
    await Promise.resolve();
    clearOidcSession();
    releaseSync?.();
    await vi.waitUntil(() => vi.mocked(bffSessionSync.clearBffSessionCookie).mock.calls.length >= 2);

    expect(bffSessionSync.clearBffSessionCookie).toHaveBeenCalledTimes(2);
  });

  it("does not let stale token sync cleanup clear a replacement session cookie", async () => {
    let releaseStaleSync: (() => void) | undefined;
    let syncCall = 0;

    vi.spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse").mockImplementation(
      () => {
        syncCall += 1;

        if (syncCall === 1) {
          return new Promise<void>((resolve) => {
            releaseStaleSync = resolve;
          });
        }

        return Promise.resolve();
      },
    );
    const clearBffSessionCookieMock = vi
      .spyOn(bffSessionSync, "clearBffSessionCookie")
      .mockResolvedValue();

    const staleAccessToken = accessTokenWithSubjectClaim("stale-token");
    const replacementAccessToken = accessTokenWithSubjectClaim("replacement-token");

    persistTokenResponse({ access_token: staleAccessToken, expires_in: 3600 });
    await Promise.resolve();
    await Promise.resolve();
    clearOidcSession();
    persistTokenResponse({ access_token: replacementAccessToken, expires_in: 3600 });

    await Promise.resolve();
    releaseStaleSync?.();
    await vi.waitUntil(() => syncCall === 2);
    await Promise.resolve();

    expect(clearBffSessionCookieMock).toHaveBeenCalledTimes(1);
  });

  it("reapplies replacement token sync when a stale sign-out-era POST completes late", async () => {
    let releaseStaleSync: (() => void) | undefined;
    let lastSyncedAccessToken = "";
    const staleAccessToken = accessTokenWithSubjectClaim("stale-token");
    const replacementAccessToken = accessTokenWithSubjectClaim("replacement-token");

    vi.spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse").mockImplementation(
      async (tokens) => {
        if (tokens.access_token === staleAccessToken) {
          await new Promise<void>((resolve) => {
            releaseStaleSync = resolve;
          });
        }

        lastSyncedAccessToken = tokens.access_token;
      },
    );

    persistTokenResponse({ access_token: staleAccessToken, expires_in: 3600 });
    await Promise.resolve();
    await Promise.resolve();
    clearOidcSession();
    persistTokenResponse({ access_token: replacementAccessToken, expires_in: 3600 });

    await Promise.resolve();
    await Promise.resolve();

    expect(lastSyncedAccessToken).toBe(replacementAccessToken);

    releaseStaleSync?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(lastSyncedAccessToken).toBe(replacementAccessToken);
  });

  it("returns null for zero-width-only display-name hints read from sessionStorage", () => {
    sessionStorage.setItem(OIDC_DISPLAY_NAME_KEY, "\u200b\u200b");

    expect(readSignedInDisplayName()).toBeNull();
  });

  it("returns null for zero-width-only subject hints read from sessionStorage", () => {
    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "\u200b");

    expect(readSignedInUserSubject()).toBeNull();
  });

  it("strips zero-width padding when reading display-name hints from sessionStorage", () => {
    sessionStorage.setItem(OIDC_DISPLAY_NAME_KEY, "\u200bJane Operator\u200b");

    expect(readSignedInDisplayName()).toBe("Jane Operator");
  });

  it("collapses interior ZWSP in legacy stored display names instead of gluing words", () => {
    sessionStorage.setItem(OIDC_DISPLAY_NAME_KEY, "John\u200bDoe");

    expect(readSignedInDisplayName()).toBe("John Doe");
  });

  it("preserves ZWNJ in stored display names when re-read from sessionStorage", () => {
    const persianName = "می\u200cخواهم";

    sessionStorage.setItem(OIDC_DISPLAY_NAME_KEY, persianName);

    expect(readSignedInDisplayName()).toBe(persianName);
  });

  it("strips zero-width padding when reading user subject hints from sessionStorage", () => {
    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "\u200buser-123\u200b");

    expect(readSignedInUserSubject()).toBe("user-123");
  });

  it("does not store zero-width-only subject hints from JWT claims", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "\u200b\u200b", exp: Math.floor(Date.now() / 1000) + 3600 })).toString(
      "base64url",
    );
    const accessToken = `${header}.${payload}.sig`;

    persistTokenResponse({ access_token: accessToken, expires_in: 3600 });

    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBeNull();
  });

  it("stores non-sensitive display name and subject hints from JWT claims", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ sub: "user-123", name: "Jane Operator", exp: Math.floor(Date.now() / 1000) + 3600 }),
    ).toString("base64url");
    const accessToken = `${header}.${payload}.sig`;

    persistTokenResponse({ access_token: accessToken, expires_in: 3600 });

    expect(sessionStorage.getItem(OIDC_DISPLAY_NAME_KEY)).toBe("Jane Operator");
    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBe("user-123");
    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBeNull();
  });

  it("stores subject hints from id_token when the access JWT omits sub", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const accessPayload = Buffer.from(JSON.stringify({ scp: "openid profile" })).toString("base64url");
    const idPayload = Buffer.from(
      JSON.stringify({ sub: "id-token-user", name: "Jane Operator", exp: Math.floor(Date.now() / 1000) + 3600 }),
    ).toString("base64url");

    persistTokenResponse({
      access_token: `${header}.${accessPayload}.sig`,
      id_token: `${header}.${idPayload}.sig`,
      expires_in: 3600,
    });

    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBe("id-token-user");
    expect(sessionStorage.getItem(OIDC_DISPLAY_NAME_KEY)).toBe("Jane Operator");
  });

  it("does not persist expiry hints for opaque access tokens without identity claims", () => {
    persistTokenResponse({ access_token: "opaque-access-token", expires_in: 3600 });

    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_DISPLAY_NAME_KEY)).toBeNull();
  });

  it("keeps authorize-callback retry marker when token response has no identity hints", () => {
    markAuthorizeCallbackFailed();

    persistTokenResponse({ access_token: "opaque-access-token", expires_in: 3600 });

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("clears authorize-callback retry marker after a successful identity persist", () => {
    markAuthorizeCallbackFailed();

    persistTokenResponse({ access_token: accessTokenWithSubjectClaim(), expires_in: 3600 });

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("clears authorize retry return snapshot after a successful identity persist", () => {
    storePostSignInReturnUrl("/architecture/reviews/run-success");
    markAuthorizeCallbackFailed();

    persistTokenResponse({ access_token: accessTokenWithSubjectClaim(), expires_in: 3600 });

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY)).toBeNull();
  });

  it("does not sync identity-less opaque tokens to the BFF cookie", async () => {
    const syncMock = vi.spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse").mockResolvedValue();
    const clearMock = vi.spyOn(bffSessionSync, "clearBffSessionCookie").mockResolvedValue();

    persistTokenResponse({ access_token: "opaque-access-token", expires_in: 3600 });

    await Promise.resolve();
    await Promise.resolve();

    expect(syncMock).not.toHaveBeenCalled();
    expect(clearMock).toHaveBeenCalledTimes(1);
  });

  it("clears the BFF cookie again when a stale token sync completes after an identity-less replacement persist", async () => {
    let releaseStaleSync: (() => void) | undefined;
    const authorizedToken = accessTokenWithSubjectClaim("authorized-user");

    vi.spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse").mockImplementation(
      async (tokens) => {
        if (tokens.access_token === authorizedToken) {
          await new Promise<void>((resolve) => {
            releaseStaleSync = resolve;
          });
        }
      },
    );
    const clearMock = vi.spyOn(bffSessionSync, "clearBffSessionCookie").mockResolvedValue();

    persistTokenResponse({ access_token: authorizedToken, expires_in: 3600 });
    await Promise.resolve();
    await Promise.resolve();
    await vi.waitUntil(() => releaseStaleSync !== undefined);

    persistTokenResponse({ access_token: "opaque-identity-less", expires_in: 3600 });
    await Promise.resolve();
    await Promise.resolve();

    expect(clearMock).toHaveBeenCalledTimes(1);

    releaseStaleSync?.();
    await vi.waitUntil(() => clearMock.mock.calls.length >= 2);
  });

  it("persists expiry hints for opaque access when id_token supplies subject", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const idPayload = Buffer.from(JSON.stringify({ sub: "opaque-pair-user" })).toString("base64url");

    persistTokenResponse({
      access_token: "opaque-access-token",
      id_token: `${header}.${idPayload}.sig`,
      expires_in: 3600,
    });

    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBe("opaque-pair-user");
    expect(Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY))).toBeGreaterThan(Date.now());
  });

  it("prefers access-token subject over a conflicting id_token subject", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const accessPayload = Buffer.from(JSON.stringify({ sub: "access-subject" })).toString("base64url");
    const idPayload = Buffer.from(JSON.stringify({ sub: "id-token-subject" })).toString("base64url");

    persistTokenResponse({
      access_token: `${header}.${accessPayload}.sig`,
      id_token: `${header}.${idPayload}.sig`,
      expires_in: 3600,
    });

    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBe("access-subject");
  });

  it("clears stale identity hints when a replacement token has no identity claims", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const previousPayload = Buffer.from(JSON.stringify({ sub: "previous-user", name: "Previous User" })).toString(
      "base64url",
    );
    const replacementPayload = Buffer.from(JSON.stringify({})).toString("base64url");

    persistTokenResponse({
      access_token: `${header}.${previousPayload}.sig`,
      expires_in: 3600,
    });
    persistTokenResponse({
      access_token: `${header}.${replacementPayload}.sig`,
      expires_in: 3600,
    });

    expect(sessionStorage.getItem(OIDC_DISPLAY_NAME_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBeNull();
  });

  it("keeps an older token sync from overwriting a newer same-session sync", async () => {
    let releaseOlderSync: (() => void) | undefined;
    let bffAccessToken = "";
    const olderAccessToken = accessTokenWithSubjectClaim("older-token");
    const newerAccessToken = accessTokenWithSubjectClaim("newer-token");
    const syncMock = vi
      .spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse")
      .mockImplementation(async (tokens) => {
        if (tokens.access_token === olderAccessToken) {
          await new Promise<void>((resolve) => {
            releaseOlderSync = resolve;
          });
        }

        bffAccessToken = tokens.access_token;
      });

    persistTokenResponse({ access_token: olderAccessToken, expires_in: 3600 });
    await Promise.resolve();
    await Promise.resolve();
    await vi.waitUntil(() => syncMock.mock.calls.length === 1);

    persistTokenResponse({ access_token: newerAccessToken, expires_in: 3600 });
    releaseOlderSync?.();
    await vi.waitUntil(() => syncMock.mock.calls.length === 2);
    await vi.waitUntil(() => bffAccessToken === newerAccessToken);

    expect(bffAccessToken).toBe(newerAccessToken);
  });

  it("keeps BFF sync POST count bounded during rapid overlapping token persists", async () => {
    const releaseByToken = new Map<string, () => void>();
    const slowAccessToken1 = accessTokenWithSubjectClaim("slow-1");
    const slowAccessToken2 = accessTokenWithSubjectClaim("slow-2");
    const finalAccessToken = accessTokenWithSubjectClaim("final-token");
    const syncMock = vi
      .spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse")
      .mockImplementation(async (tokens) => {
        const token = tokens.access_token;

        if (token === slowAccessToken1 || token === slowAccessToken2) {
          await new Promise<void>((resolve) => {
            releaseByToken.set(token, resolve);
          });
        }
      });

    persistTokenResponse({ access_token: slowAccessToken1, expires_in: 3600 });
    persistTokenResponse({ access_token: slowAccessToken2, expires_in: 3600 });
    persistTokenResponse({ access_token: finalAccessToken, expires_in: 3600 });

    await Promise.resolve();
    await Promise.resolve();

    releaseByToken.get(slowAccessToken1)?.();
    await Promise.resolve();
    releaseByToken.get(slowAccessToken2)?.();
    await vi.waitUntil(() => syncMock.mock.calls.length >= 5);

    expect(syncMock.mock.calls.length).toBeLessThanOrEqual(7);
    expect(syncMock.mock.calls.at(-1)?.[0].access_token).toBe(finalAccessToken);
  });

  it("does not block a newer sync behind a hung older request", async () => {
    let bffAccessToken = "";
    const hungAccessToken = accessTokenWithSubjectClaim("hung-token");
    const newerAccessToken = accessTokenWithSubjectClaim("newer-token");
    const syncMock = vi
      .spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse")
      .mockImplementation(async (tokens) => {
        if (tokens.access_token === hungAccessToken) {
          await new Promise<void>(() => {});
        }

        bffAccessToken = tokens.access_token;
      });

    persistTokenResponse({ access_token: hungAccessToken, expires_in: 3600 });
    await Promise.resolve();
    await Promise.resolve();
    await vi.waitUntil(() => syncMock.mock.calls.length === 1);

    persistTokenResponse({ access_token: newerAccessToken, expires_in: 3600 });
    await vi.waitUntil(() => syncMock.mock.calls.length === 2);

    expect(bffAccessToken).toBe(newerAccessToken);
  });
});

describe("consumePkceState", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("consumes the matching primary or google flow by callback state", () => {
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");
    storePkceState("google-state", "google-verifier", "google-nonce", "google");

    expect(consumePkceState("google-state")).toEqual({
      state: "google-state",
      codeVerifier: "google-verifier",
      nonce: "google-nonce",
      flow: "google",
    });
    expect(consumePkceState("primary-state")).toEqual({
      state: "primary-state",
      codeVerifier: "primary-verifier",
      nonce: "primary-nonce",
      flow: "primary",
    });
  });

  it("matches stored PKCE state when the callback state query value has surrounding whitespace", () => {
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");

    expect(consumePkceState("  primary-state  ")).toEqual({
      state: "primary-state",
      codeVerifier: "primary-verifier",
      nonce: "primary-nonce",
      flow: "primary",
    });
  });

  it("rejects whitespace-only callback state values", () => {
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");

    expect(consumePkceState("   ")).toBeNull();
  });

  it("matches stored PKCE state when the callback state query value has zero-width padding", () => {
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");

    expect(consumePkceState(`\u200bprimary-state\u200b`)).toEqual({
      state: "primary-state",
      codeVerifier: "primary-verifier",
      nonce: "primary-nonce",
      flow: "primary",
    });
  });

  it("matches stored PKCE state when the callback state query value has trailing control characters", () => {
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");

    expect(consumePkceState("primary-state\u000B")).toEqual({
      state: "primary-state",
      codeVerifier: "primary-verifier",
      nonce: "primary-nonce",
      flow: "primary",
    });
  });

  it("rejects PKCE consume when tampered session state contains interior backspace control characters", () => {
    storePkceState("desk\u0008state", "primary-verifier", "primary-nonce", "primary");

    expect(consumePkceState("desk\u0008state")).toBeNull();
  });

  it("rejects PKCE consume when tampered session state contains interior form-feed control characters", () => {
    storePkceState("desk\u000Cstate", "primary-verifier", "primary-nonce", "primary");

    expect(consumePkceState("desk\u000Cstate")).toBeNull();
  });

  it("rejects PKCE consume when tampered session verifier contains interior backspace control characters", () => {
    storePkceState("primary-state", "ver\u0008ifier", "primary-nonce", "primary");

    expect(consumePkceState("primary-state")).toBeNull();
  });

  it("rejects PKCE consume when tampered session verifier contains interior form-feed control characters", () => {
    storePkceState("primary-state", "ver\u000Cifier", "primary-nonce", "primary");

    expect(consumePkceState("primary-state")).toBeNull();
  });

  it("rejects PKCE consume when tampered session verifier contains interior bell control characters", () => {
    storePkceState("primary-state", "ver\u0007ifier", "primary-nonce", "primary");

    expect(consumePkceState("primary-state")).toBeNull();
  });

  it("returns normalized PKCE verifier and nonce values read from sessionStorage", () => {
    storePkceState("primary-state", `\u200bprimary-verifier\u200b`, `\u200bprimary-nonce\u200b`, "primary");

    expect(consumePkceState("primary-state")).toEqual({
      state: "primary-state",
      codeVerifier: "primary-verifier",
      nonce: "primary-nonce",
      flow: "primary",
    });
  });

  it("rejects PKCE consume when tampered session state contains interior vertical-tab control characters", () => {
    storePkceState("desk\u000Bstate", "primary-verifier", "primary-nonce", "primary");

    expect(consumePkceState("desk\u000Bstate")).toBeNull();
  });

  it("rejects PKCE consume when tampered session verifier contains interior vertical-tab control characters", () => {
    storePkceState("primary-state", "ver\u000Bifier", "primary-nonce", "primary");

    expect(consumePkceState("primary-state")).toBeNull();
  });

  it("rejects PKCE consume when tampered session nonce contains interior form-feed control characters", () => {
    storePkceState("primary-state", "primary-verifier", "nonce\u000Cvalue", "primary");

    expect(consumePkceState("primary-state")).toBeNull();
  });

  it("rejects PKCE consume when tampered session nonce contains interior backspace control characters", () => {
    storePkceState("primary-state", "primary-verifier", "nonce\u0008value", "primary");

    expect(consumePkceState("primary-state")).toBeNull();
  });

  it("rejects PKCE consume when tampered session nonce contains interior bell control characters", () => {
    storePkceState("primary-state", "primary-verifier", "nonce\u0007value", "primary");

    expect(consumePkceState("primary-state")).toBeNull();
  });
});

describe("clearOidcSession", () => {
  let postMessageMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    postMessageMock = vi.fn();

    class TestBroadcastChannel {
      postMessage = postMessageMock;
      close = vi.fn();
      addEventListener = vi.fn();
      removeEventListener = vi.fn();

      constructor(public readonly name: string) {}
    }

    vi.stubGlobal("BroadcastChannel", TestBroadcastChannel);
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("clears a stored post-sign-in return URL when signed-in identity was present", () => {
    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-123");
    storePostSignInReturnUrl("/architecture/reviews/123");
    clearOidcSession();

    expect(consumePostSignInReturnUrl()).toBeNull();
  });

  it("preserves post-sign-in return URL when clearing without signed-in identity", () => {
    storePostSignInReturnUrl("/architecture/reviews/123");
    clearOidcSession();

    expect(consumePostSignInReturnUrl()).toBe("/architecture/reviews/123");
  });

  it("clears a pending authorize-callback retry marker when signed-in identity was present", () => {
    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-123");
    markAuthorizeCallbackFailed();
    clearOidcSession();

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
  });

  it("clears authorize retry return snapshot when clearing a signed-in session", () => {
    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-123");
    storePostSignInReturnUrl("/architecture/reviews/stale-snapshot");
    markAuthorizeCallbackFailed();
    clearOidcSession();

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY)).toBeNull();
  });

  it("drops a tampered unsafe authorize retry return snapshot without clearing the retry marker", () => {
    sessionStorage.setItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY, "https://evil.example/phish");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

    expect(readAuthorizeRetryReturnPathSnapshot()).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("clears authorize retry return snapshot when authorize retry marker is consumed", () => {
    storePostSignInReturnUrl("/architecture/reviews/run-consume");
    markAuthorizeCallbackFailed();

    expect(consumeAuthorizeCallbackFailedRetry()).toBe(true);
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY)).toBeNull();
  });

  it("preserves authorize-callback retry marker when clearing without signed-in identity", () => {
    markAuthorizeCallbackFailed();
    clearOidcSession();

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("preserves authorize-retry return snapshot when clearing without signed-in identity", () => {
    storePostSignInReturnUrl("/architecture/reviews/retry-keep");
    markAuthorizeCallbackFailed();
    clearOidcSession();

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY)).toBe(
      "/architecture/reviews/retry-keep",
    );
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("broadcasts auth-cleared by default (LW-083)", () => {
    clearOidcSession();

    expect(postMessageMock).toHaveBeenCalledWith({ type: "auth-cleared" });
    expect(JSON.stringify(postMessageMock.mock.calls[0]?.[0])).not.toMatch(/token/i);
  });

  it("skips auth-cleared broadcast when broadcastAuthCleared is false", () => {
    clearOidcSession({ broadcastAuthCleared: false });

    expect(postMessageMock).not.toHaveBeenCalled();
  });
});
