import { afterEach, describe, expect, it } from "vitest";

import {
  clearOidcSession,
  consumePostSignInReturnUrl,
  getAccessTokenForApi,
  isLikelySignedIn,
  persistTokenResponse,
  storePostSignInReturnUrl,
} from "@/lib/oidc/session";
import {
  OIDC_ACCESS_TOKEN_KEY,
  OIDC_EXPIRES_AT_MS_KEY,
} from "@/lib/oidc/storage-keys";

describe("storePostSignInReturnUrl / consumePostSignInReturnUrl", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("round-trips a safe local path", () => {
    storePostSignInReturnUrl("/architecture/reviews/123");

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

describe("getAccessTokenForApi / isLikelySignedIn expiry parsing", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("treats a non-numeric expires_at as expired instead of bypassing skew checks", () => {
    sessionStorage.setItem(OIDC_ACCESS_TOKEN_KEY, "stale-access");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, "not-a-number");

    expect(getAccessTokenForApi()).toBeUndefined();
    expect(isLikelySignedIn()).toBe(false);
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
    expect(getAccessTokenForApi()).toBe("tok");
  });

  it("honors zero expires_in so callers refresh immediately", () => {
    persistTokenResponse({ access_token: "tok", expires_in: 0 });

    expect(getAccessTokenForApi()).toBeUndefined();
    expect(isLikelySignedIn()).toBe(false);
  });
});

describe("clearOidcSession", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("clears a stored post-sign-in return URL", () => {
    storePostSignInReturnUrl("/architecture/reviews/123");
    clearOidcSession();

    expect(consumePostSignInReturnUrl()).toBeNull();
  });
});
