import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isJwtAuthMode, getOidcAuthority, getOidcClientId } from "@/lib/oidc/config";
import * as discovery from "@/lib/oidc/discovery";
import { clearOidcSession, ensureAccessTokenFresh } from "@/lib/oidc/session";
import {
  OIDC_ACCESS_TOKEN_KEY,
  OIDC_EXPIRES_AT_MS_KEY,
  OIDC_REFRESH_TOKEN_KEY,
} from "@/lib/oidc/storage-keys";
import * as tokenClient from "@/lib/oidc/token-client";

const discoveryDoc = {
  issuer: "https://login.example.com/tenant",
  authorization_endpoint: "https://login.example.com/authorize",
  token_endpoint: "https://login.example.com/token",
};

describe("ensureAccessTokenFresh", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_AUTH_MODE", "jwt");
    vi.stubEnv("NEXT_PUBLIC_OIDC_AUTHORITY", "https://login.example.com/tenant");
    vi.stubEnv("NEXT_PUBLIC_OIDC_CLIENT_ID", "test-client");
    vi.spyOn(discovery, "loadDiscoveryDocument").mockResolvedValue(discoveryDoc);
    vi.spyOn(tokenClient, "refreshAccessToken");
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("refreshes an expired access token when jwt mode is enabled", async () => {
    vi.mocked(tokenClient.refreshAccessToken).mockResolvedValue({
      access_token: "refreshed",
      expires_in: 3600,
      refresh_token: "rt-new",
    });

    sessionStorage.setItem(OIDC_ACCESS_TOKEN_KEY, "old-access");
    sessionStorage.setItem(OIDC_REFRESH_TOKEN_KEY, "old-refresh");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    expect(isJwtAuthMode()).toBe(true);
    expect(getOidcAuthority()).toBe("https://login.example.com/tenant");
    expect(getOidcClientId()).toBe("test-client");

    await ensureAccessTokenFresh();

    expect(tokenClient.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBe("refreshed");
  });

  it("dedupes concurrent refresh attempts so a duplicate failure does not clear the session", async () => {
    let refreshCalls = 0;

    vi.mocked(tokenClient.refreshAccessToken).mockImplementation(async () => {
      refreshCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 25));

      if (refreshCalls > 1) {
        throw new Error("invalid_grant");
      }

      return { access_token: "refreshed", expires_in: 3600, refresh_token: "rt-new" };
    });

    sessionStorage.setItem(OIDC_ACCESS_TOKEN_KEY, "old-access");
    sessionStorage.setItem(OIDC_REFRESH_TOKEN_KEY, "old-refresh");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    await Promise.all([ensureAccessTokenFresh(), ensureAccessTokenFresh()]);

    expect(tokenClient.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBe("refreshed");
    expect(sessionStorage.getItem(OIDC_REFRESH_TOKEN_KEY)).toBe("rt-new");
  });

  it("refreshes the replacement session when a stale refresh is still in-flight", async () => {
    let releaseStaleRefresh: (() => void) | undefined;
    let refreshCalls = 0;

    vi.mocked(tokenClient.refreshAccessToken).mockImplementation(async () => {
      refreshCalls += 1;

      if (refreshCalls === 1) {
        return new Promise((resolve) => {
          releaseStaleRefresh = () => {
            resolve({ access_token: "stale", expires_in: 3600, refresh_token: "rt-stale" });
          };
        });
      }

      return { access_token: "refreshed-new", expires_in: 3600, refresh_token: "rt-new" };
    });

    sessionStorage.setItem(OIDC_ACCESS_TOKEN_KEY, "old-access");
    sessionStorage.setItem(OIDC_REFRESH_TOKEN_KEY, "old-refresh");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    const stalePromise = ensureAccessTokenFresh();
    await Promise.resolve();

    clearOidcSession();
    sessionStorage.setItem(OIDC_ACCESS_TOKEN_KEY, "new-access");
    sessionStorage.setItem(OIDC_REFRESH_TOKEN_KEY, "new-refresh");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    const replacementPromise = ensureAccessTokenFresh();

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(refreshCalls).toBe(2);

    releaseStaleRefresh?.();
    await Promise.all([stalePromise, replacementPromise]);

    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBe("refreshed-new");
  });

  it("does not clear the session when refresh fails due to a transient network error", async () => {
    vi.mocked(tokenClient.refreshAccessToken).mockRejectedValue(new TypeError("Failed to fetch"));

    sessionStorage.setItem(OIDC_ACCESS_TOKEN_KEY, "old-access");
    sessionStorage.setItem(OIDC_REFRESH_TOKEN_KEY, "old-refresh");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    await ensureAccessTokenFresh();

    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBe("old-access");
    expect(sessionStorage.getItem(OIDC_REFRESH_TOKEN_KEY)).toBe("old-refresh");
  });

  it("still clears the session when refresh fails with invalid_grant", async () => {
    vi.mocked(tokenClient.refreshAccessToken).mockRejectedValue(
      new Error("invalid_grant: refresh token expired"),
    );

    sessionStorage.setItem(OIDC_ACCESS_TOKEN_KEY, "old-access");
    sessionStorage.setItem(OIDC_REFRESH_TOKEN_KEY, "old-refresh");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    await ensureAccessTokenFresh();

    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_REFRESH_TOKEN_KEY)).toBeNull();
  });

  it("does not resurrect tokens when clearOidcSession runs during an in-flight refresh", async () => {
    let releaseRefresh: (() => void) | undefined;

    vi.mocked(tokenClient.refreshAccessToken).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseRefresh = () => {
            resolve({ access_token: "refreshed", expires_in: 3600, refresh_token: "rt-new" });
          };
        }),
    );

    sessionStorage.setItem(OIDC_ACCESS_TOKEN_KEY, "old-access");
    sessionStorage.setItem(OIDC_REFRESH_TOKEN_KEY, "old-refresh");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now()));

    const refreshPromise = ensureAccessTokenFresh();

    await Promise.resolve();
    clearOidcSession();
    releaseRefresh?.();
    await refreshPromise;

    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_REFRESH_TOKEN_KEY)).toBeNull();
  });
});
