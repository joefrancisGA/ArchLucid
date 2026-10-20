import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isJwtAuthMode } from "@/lib/oidc/config";
import * as bffSessionSync from "@/lib/oidc/bff-session-sync";
import { clearOidcSession, ensureAccessTokenFresh, persistTokenResponse } from "@/lib/oidc/session";
import {
  OIDC_DISPLAY_NAME_KEY,
  OIDC_EXPIRES_AT_MS_KEY,
  OIDC_USER_SUBJECT_KEY,
} from "@/lib/oidc/storage-keys";

function seedExpiredSessionWithIdentityHints(): void {
  sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-123");
  sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));
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

    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    persistTokenResponse({ access_token: "new-token", expires_in: 3600 });

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

    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

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

    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();

    persistTokenResponse({ access_token: "new-token", expires_in: 3600 });
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

    persistTokenResponse({ access_token: "tok", expires_in: 3600 });
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
