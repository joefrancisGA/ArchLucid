import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as bffSessionSync from "@/lib/oidc/bff-session-sync";
import {
  clearOidcSession,
  consumePkceState,
  consumePostSignInReturnUrl,
  getAccessTokenForApi,
  isLikelySignedIn,
  persistTokenResponse,
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
  OIDC_POST_SIGN_IN_RETURN_URL_KEY,
  OIDC_REFRESH_TOKEN_KEY,
  OIDC_USER_SUBJECT_KEY,
} from "@/lib/oidc/storage-keys";

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
});

describe("getAccessTokenForApi / isLikelySignedIn expiry parsing (LK-06 P2)", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("never exposes access tokens from sessionStorage after sign-in", () => {
    persistTokenResponse({ access_token: "tok", expires_in: 3600 });

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

    expect(isLikelySignedIn()).toBe(true);
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
});

describe("persistTokenResponse", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("treats negative expires_in as the default lifetime instead of writing a past expiry", () => {
    persistTokenResponse({ access_token: "tok", expires_in: -120 });

    const expiresAtMs = Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY));

    expect(Number.isFinite(expiresAtMs)).toBe(true);
    expect(expiresAtMs).toBeGreaterThan(Date.now());
    expect(isLikelySignedIn()).toBe(true);
    expect(getAccessTokenForApi()).toBeUndefined();
    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBeNull();
  });

  it("honors zero expires_in so callers refresh immediately", () => {
    persistTokenResponse({ access_token: "tok", expires_in: 0 });

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

  it("coerces string expires_in from the token response before writing expiry", () => {
    persistTokenResponse({ access_token: "tok", expires_in: "7200" as unknown as number });

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
    persistTokenResponse({ access_token: "tok", expires_in: 10.9 });

    const expiresAtMs = Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY));

    expect(expiresAtMs - before).toBe(10_000);
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

    persistTokenResponse({ access_token: "tok", expires_in: 3600 });
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

    persistTokenResponse({ access_token: "stale-token", expires_in: 3600 });
    await Promise.resolve();
    await Promise.resolve();
    clearOidcSession();
    persistTokenResponse({ access_token: "replacement-token", expires_in: 3600 });

    await Promise.resolve();
    releaseStaleSync?.();
    await vi.waitUntil(() => syncCall === 2);
    await Promise.resolve();

    expect(clearBffSessionCookieMock).toHaveBeenCalledTimes(1);
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
  });

  it("keeps an older token sync from overwriting a newer same-session sync", async () => {
    let releaseOlderSync: (() => void) | undefined;
    let bffAccessToken = "";
    const syncMock = vi
      .spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse")
      .mockImplementation(async (tokens) => {
        if (tokens.access_token === "older-token") {
          await new Promise<void>((resolve) => {
            releaseOlderSync = resolve;
          });
        }

        bffAccessToken = tokens.access_token;
      });

    persistTokenResponse({ access_token: "older-token", expires_in: 3600 });
    await Promise.resolve();
    await Promise.resolve();
    await vi.waitUntil(() => syncMock.mock.calls.length === 1);

    persistTokenResponse({ access_token: "newer-token", expires_in: 3600 });
    releaseOlderSync?.();
    await vi.waitUntil(() => syncMock.mock.calls.length === 2);
    await vi.waitUntil(() => bffAccessToken === "newer-token");

    expect(bffAccessToken).toBe("newer-token");
  });

  it("keeps BFF sync POST count bounded during rapid overlapping token persists", async () => {
    const releaseByToken = new Map<string, () => void>();
    const syncMock = vi
      .spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse")
      .mockImplementation(async (tokens) => {
        const token = tokens.access_token;

        if (token.startsWith("slow-")) {
          await new Promise<void>((resolve) => {
            releaseByToken.set(token, resolve);
          });
        }
      });

    persistTokenResponse({ access_token: "slow-1", expires_in: 3600 });
    persistTokenResponse({ access_token: "slow-2", expires_in: 3600 });
    persistTokenResponse({ access_token: "final-token", expires_in: 3600 });

    await Promise.resolve();
    await Promise.resolve();

    releaseByToken.get("slow-1")?.();
    await Promise.resolve();
    releaseByToken.get("slow-2")?.();
    await vi.waitUntil(() => syncMock.mock.calls.length >= 5);

    expect(syncMock.mock.calls.length).toBeLessThanOrEqual(7);
    expect(syncMock.mock.calls.at(-1)?.[0].access_token).toBe("final-token");
  });

  it("does not block a newer sync behind a hung older request", async () => {
    let bffAccessToken = "";
    const syncMock = vi
      .spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse")
      .mockImplementation(async (tokens) => {
        if (tokens.access_token === "hung-token") {
          await new Promise<void>(() => {});
        }

        bffAccessToken = tokens.access_token;
      });

    persistTokenResponse({ access_token: "hung-token", expires_in: 3600 });
    await Promise.resolve();
    await Promise.resolve();
    await vi.waitUntil(() => syncMock.mock.calls.length === 1);

    persistTokenResponse({ access_token: "newer-token", expires_in: 3600 });
    await vi.waitUntil(() => syncMock.mock.calls.length === 2);

    expect(bffAccessToken).toBe("newer-token");
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

  it("returns normalized PKCE verifier and nonce values read from sessionStorage", () => {
    storePkceState("primary-state", `\u200bprimary-verifier\u200b`, `\u200bprimary-nonce\u200b`, "primary");

    expect(consumePkceState("primary-state")).toEqual({
      state: "primary-state",
      codeVerifier: "primary-verifier",
      nonce: "primary-nonce",
      flow: "primary",
    });
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

  it("clears a stored post-sign-in return URL", () => {
    storePostSignInReturnUrl("/architecture/reviews/123");
    clearOidcSession();

    expect(consumePostSignInReturnUrl()).toBeNull();
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
