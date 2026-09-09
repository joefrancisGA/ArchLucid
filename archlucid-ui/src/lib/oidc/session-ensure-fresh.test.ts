import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isJwtAuthMode } from "@/lib/oidc/config";
import * as bffSessionSync from "@/lib/oidc/bff-session-sync";
import { clearOidcSession, ensureAccessTokenFresh } from "@/lib/oidc/session";
import { OIDC_EXPIRES_AT_MS_KEY } from "@/lib/oidc/storage-keys";

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

    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    expect(isJwtAuthMode()).toBe(true);

    await ensureAccessTokenFresh();

    expect(bffSessionSync.refreshBffSessionCookie).toHaveBeenCalledTimes(1);
    expect(Number(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY))).toBeGreaterThan(Date.now());
  });

  it("dedupes concurrent BFF refresh attempts", async () => {
    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));

      return { ok: true, expiresAtMs: Date.now() + 3_600_000 };
    });

    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    await Promise.all([ensureAccessTokenFresh(), ensureAccessTokenFresh()]);

    expect(bffSessionSync.refreshBffSessionCookie).toHaveBeenCalledTimes(1);
  });

  it("clears the session when BFF refresh is rejected", async () => {
    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockResolvedValue({
      ok: false,
      shouldClearSession: true,
    });

    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    await ensureAccessTokenFresh();

    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).toBeNull();
  });

  it("does not clear the session on transient BFF refresh failure", async () => {
    vi.mocked(bffSessionSync.refreshBffSessionCookie).mockResolvedValue({
      ok: false,
      shouldClearSession: false,
    });

    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    await ensureAccessTokenFresh();

    expect(sessionStorage.getItem(OIDC_EXPIRES_AT_MS_KEY)).not.toBeNull();
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
});
