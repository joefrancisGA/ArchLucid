import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isJwtAuthMode } from "@/lib/oidc/config";
import * as bffSessionSync from "@/lib/oidc/bff-session-sync";
import {
  clearOidcSession,
  ensureAccessTokenFresh,
  persistTokenResponse,
  storePkceState,
} from "@/lib/oidc/session";
import {
  OIDC_DISPLAY_NAME_KEY,
  OIDC_EXPIRES_AT_MS_KEY,
  OIDC_OAUTH_STATE_KEY,
  OIDC_USER_SUBJECT_KEY,
} from "@/lib/oidc/storage-keys";

function seedExpiredSessionWithIdentityHints(): void {
  sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-123");
  sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));
}

function accessTokenWithSubjectClaim(sub: string = "user-test"): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub })).toString("base64url");

  return `${header}.${payload}.sig`;
}

describe("ensureAccessTokenFresh (LK-06 P2 BFF refresh)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_AUTH_MODE", "jwt");
    vi.spyOn(bffSessionSync, "refreshBffSessionCookie");
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("refreshes an expired session via the BFF route when jwt mode is enabled", async () => {
    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockResolvedValue({
      ok: true,
      expiresAtMs: Date.now() + 3_600_000,
    });

    seedExpiredSessionWithIdentityHints();

    expect(isJwtAuthMode()).toBe(true);

    await ensureAccessTokenFresh();

    expect(bffSessionSync.refreshBffSessionCookie).toHaveBeenCalledTimes(1);
    expect(Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY))).toBeGreaterThan(Date.now());
  });

  it("refreshes via BFF when the expires_at_ms session hint has zero-width padding", async () => {
    const refreshedMs = Date.now() + 3_600_000;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockResolvedValue({
      ok: true,
      expiresAtMs: refreshedMs,
    });

    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-123");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, `${Date.now()}\u200b`);

    await ensureAccessTokenFresh();

    expect(bffSessionSync.refreshBffSessionCookie).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBe(String(refreshedMs));
  });

  it("dedupes concurrent BFF refresh attempts", async () => {
    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));

      return { ok: true, expiresAtMs: Date.now() + 3_600_000 };
    });

    seedExpiredSessionWithIdentityHints();

    await Promise.all([ensureAccessTokenFresh(), ensureAccessTokenFresh()]);

    expect(bffSessionSync.refreshBffSessionCookie).toHaveBeenCalledTimes(1);
  });

  it("clears the session when BFF refresh is rejected", async () => {
    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockResolvedValue({
      ok: false,
      shouldClearSession: true,
    });

    seedExpiredSessionWithIdentityHints();

    await ensureAccessTokenFresh();

    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBeNull();
  });

  it("does not clear the session on transient BFF refresh failure", async () => {
    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockResolvedValue({
      ok: false,
      shouldClearSession: false,
    });

    seedExpiredSessionWithIdentityHints();

    await ensureAccessTokenFresh();

    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).not.toBeNull();
  });

  it("does not clear a fresh sign-in when a pre-sign-in BFF refresh is rejected", async () => {
    let releaseRefresh: (() => void) | undefined;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: false, shouldClearSession: true });
          };
        }),
    );
    vi.spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse").mockResolvedValue();

    seedExpiredSessionWithIdentityHints();

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    persistTokenResponse({ access_token: accessTokenWithSubjectClaim(), expires_in: 3600 });

    releaseRefresh?.();
    await refreshPromise;

    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).not.toBeNull();
    expect(Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY))).toBeGreaterThan(Date.now());
  });

  it("does not resurrect session hints when clearOidcSession runs during an in-flight refresh", async () => {
    let releaseRefresh: (() => void) | undefined;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: true, expiresAtMs: Date.now() + 3_600_000 });
          };
        }),
    );

    seedExpiredSessionWithIdentityHints();

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();
    clearOidcSession();
    releaseRefresh?.();
    await refreshPromise;

    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBeNull();
  });

  it("does not overwrite a fresh sign-in expiry hint when a pre-sign-in BFF refresh succeeds", async () => {
    let releaseRefresh: (() => void) | undefined;
    const staleBffExpiryMs = Date.now() + 60_000;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: true, expiresAtMs: staleBffExpiryMs });
          };
        }),
    );
    vi.spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse").mockResolvedValue();

    seedExpiredSessionWithIdentityHints();

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    persistTokenResponse({ access_token: accessTokenWithSubjectClaim(), expires_in: 3600 });
    const freshHintMs = Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY));

    releaseRefresh?.();
    await refreshPromise;

    expect(Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY))).toBe(freshHintMs);
    expect(freshHintMs).toBeGreaterThan(staleBffExpiryMs + 3_000_000);
  });

  it("does not refresh or restore expiry hints after sign-out cleared identity hints", async () => {
    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockResolvedValue({
      ok: true,
      expiresAtMs: Date.now() + 3_600_000,
    });

    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "user-123" })).toString("base64url");

    persistTokenResponse({ access_token: `${header}.${payload}.sig`, expires_in: 3600 });
    clearOidcSession();

    await ensureAccessTokenFresh();

    expect(bffSessionSync.refreshBffSessionCookie).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBeNull();
  });

  it("still refreshes when expiry hint is missing but identity hints remain", async () => {
    const refreshedMs = Date.now() + 3_600_000;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockResolvedValue({
      ok: true,
      expiresAtMs: refreshedMs,
    });

    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-123");

    await ensureAccessTokenFresh();

    expect(bffSessionSync.refreshBffSessionCookie).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBe(String(refreshedMs));
  });

  it("does not refresh when only a stale expires_at_ms hint remains without identity", async () => {
    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockResolvedValue({
      ok: true,
      expiresAtMs: Date.now() + 3_600_000,
    });

    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    await ensureAccessTokenFresh();

    expect(bffSessionSync.refreshBffSessionCookie).not.toHaveBeenCalled();
  });

  it("drops only the expiry hint when BFF refresh is rejected after identity hints were cleared mid-flight", async () => {
    let releaseRefresh: (() => void) | undefined;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: false, shouldClearSession: true });
          };
        }),
    );

    storePkceState("callback-state", "callback-verifier", "callback-nonce", "primary");
    seedExpiredSessionWithIdentityHints();

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    sessionStorage.removeItem(OIDC_USER_SUBJECT_KEY);

    releaseRefresh?.();
    await refreshPromise;

    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_OAUTH_STATE_KEY)).toBe("callback-state");
  });

  it("does not write refreshed expiry when identity hints are cleared during an in-flight BFF refresh", async () => {
    let releaseRefresh: (() => void) | undefined;
    const refreshedMs = Date.now() + 3_600_000;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: true, expiresAtMs: refreshedMs });
          };
        }),
    );

    seedExpiredSessionWithIdentityHints();
    const expiresHintAtRefreshStart = sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY);

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    sessionStorage.removeItem(OIDC_USER_SUBJECT_KEY);

    releaseRefresh?.();
    await refreshPromise;

    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBe(expiresHintAtRefreshStart);
  });

  it("does not write a refreshed expiry hint when identity-less replacement runs during an in-flight BFF refresh", async () => {
    let releaseRefresh: (() => void) | undefined;
    const refreshedMs = Date.now() + 3_600_000;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: true, expiresAtMs: refreshedMs });
          };
        }),
    );

    seedExpiredSessionWithIdentityHints();

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    persistTokenResponse({ access_token: "opaque-identity-less", expires_in: 3600 });

    await Promise.resolve();

    releaseRefresh?.();
    await refreshPromise;

    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBeNull();
  });

  it("does not clear a replacement sign-in when a pre-refresh BFF 401 arrives after subject hints were restored without changing expiry", async () => {
    let releaseRefresh: (() => void) | undefined;
    const expiredHintMs = Date.now();

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: false, shouldClearSession: true });
          };
        }),
    );
    vi.spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse").mockResolvedValue();

    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-before-strip");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(expiredHintMs));

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    sessionStorage.removeItem(OIDC_USER_SUBJECT_KEY);

    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(expiredHintMs - 3_600_000);

    persistTokenResponse({ access_token: accessTokenWithSubjectClaim("user-restored"), expires_in: 3600 });

    nowSpy.mockRestore();

    await Promise.resolve();

    releaseRefresh?.();
    await refreshPromise;

    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBe("user-restored");
    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBe(String(expiredHintMs));
  });

  it("does not clear a replacement sign-in when a pre-sign-out BFF refresh is rejected after identity is restored", async () => {
    let releaseRefresh: (() => void) | undefined;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: false, shouldClearSession: true });
          };
        }),
    );

    storePkceState("stale-callback-state", "stale-verifier", "stale-nonce", "primary");
    seedExpiredSessionWithIdentityHints();

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    clearOidcSession();
    storePkceState("fresh-callback-state", "fresh-verifier", "fresh-nonce", "primary");
    persistTokenResponse({ access_token: accessTokenWithSubjectClaim("user-after-sign-out"), expires_in: 3600 });

    await Promise.resolve();

    releaseRefresh?.();
    await refreshPromise;

    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBe("user-after-sign-out");
    expect(Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY))).toBeGreaterThan(Date.now());
    expect(sessionStorage.getItem(OIDC_OAUTH_STATE_KEY)).toBe("fresh-callback-state");
  });

  it("does not clear the BFF cookie when a pre-sign-out refresh succeeds after a replacement sign-in", async () => {
    let releaseRefresh: (() => void) | undefined;
    const refreshedMs = Date.now() + 3_600_000;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: true, expiresAtMs: refreshedMs });
          };
        }),
    );
    const clearMock = vi.spyOn(bffSessionSync, "clearBffSessionCookie").mockResolvedValue();
    const syncMock = vi
      .spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse")
      .mockResolvedValue();

    seedExpiredSessionWithIdentityHints();

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    clearOidcSession();

    await Promise.resolve();

    persistTokenResponse({ access_token: accessTokenWithSubjectClaim("user-after-sign-out"), expires_in: 3600 });

    await Promise.resolve();

    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(syncMock).toHaveBeenCalledTimes(1);

    releaseRefresh?.();
    await refreshPromise;

    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(syncMock).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBe("user-after-sign-out");
  });

  it("does not clear the BFF cookie when a pre-identity-less refresh succeeds after a replacement sign-in", async () => {
    let releaseRefresh: (() => void) | undefined;
    const refreshedMs = Date.now() + 3_600_000;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: true, expiresAtMs: refreshedMs });
          };
        }),
    );
    const clearMock = vi.spyOn(bffSessionSync, "clearBffSessionCookie").mockResolvedValue();
    const syncMock = vi
      .spyOn(bffSessionSync, "syncBffSessionCookieFromTokenResponse")
      .mockResolvedValue();

    seedExpiredSessionWithIdentityHints();

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    persistTokenResponse({ access_token: "opaque-identity-less", expires_in: 3600 });

    await Promise.resolve();

    persistTokenResponse({ access_token: accessTokenWithSubjectClaim("user-replacement"), expires_in: 3600 });

    await Promise.resolve();

    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(syncMock).toHaveBeenCalledTimes(1);

    releaseRefresh?.();
    await refreshPromise;

    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(syncMock).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)).toBe("user-replacement");
  });

  it("drops only the expiry hint when BFF refresh is rejected after identity-less replacement invalidates session generation", async () => {
    let releaseRefresh: (() => void) | undefined;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: false, shouldClearSession: true });
          };
        }),
    );
    const clearMock = vi.spyOn(bffSessionSync, "clearBffSessionCookie").mockResolvedValue();

    storePkceState("callback-state", "callback-verifier", "callback-nonce", "primary");
    seedExpiredSessionWithIdentityHints();

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    persistTokenResponse({ access_token: "opaque-identity-less", expires_in: 3600 });

    await Promise.resolve();

    expect(clearMock).toHaveBeenCalledTimes(1);

    releaseRefresh?.();
    await refreshPromise;

    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_OAUTH_STATE_KEY)).toBe("callback-state");
  });

  it("clears the BFF cookie when an in-flight refresh succeeds after identity-less replacement invalidates session generation", async () => {
    let releaseRefresh: (() => void) | undefined;
    const refreshedMs = Date.now() + 3_600_000;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ ok: true, expiresAtMs: refreshedMs });
          };
        }),
    );
    const clearMock = vi.spyOn(bffSessionSync, "clearBffSessionCookie").mockResolvedValue();

    seedExpiredSessionWithIdentityHints();

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    persistTokenResponse({ access_token: "opaque-identity-less", expires_in: 3600 });

    await Promise.resolve();

    expect(clearMock).toHaveBeenCalledTimes(1);

    releaseRefresh?.();
    await refreshPromise;

    expect(clearMock).toHaveBeenCalledTimes(2);
    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBeNull();
  });

  it("still refreshes when only a display-name identity hint remains", async () => {
    const refreshedMs = Date.now() + 3_600_000;

    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockResolvedValue({
      ok: true,
      expiresAtMs: refreshedMs,
    });

    sessionStorage.setItem(OIDC_DISPLAY_NAME_KEY, "Jane Operator");

    await ensureAccessTokenFresh();

    expect(bffSessionSync.refreshBffSessionCookie).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBe(String(refreshedMs));
  });
});
