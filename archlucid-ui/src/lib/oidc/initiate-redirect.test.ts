import { afterEach, describe, expect, it, vi } from "vitest";

import {
  OIDC_CODE_VERIFIER_KEY,
  OIDC_GOOGLE_CODE_VERIFIER_KEY,
  OIDC_GOOGLE_NONCE_KEY,
  OIDC_GOOGLE_OAUTH_STATE_KEY,
  OIDC_NONCE_KEY,
  OIDC_OAUTH_STATE_KEY,
} from "@/lib/oidc/storage-keys";
import { readPkceState, storePkceState } from "@/lib/oidc/session";

describe("initiate redirect PKCE isolation", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("keeps primary PKCE state when supplemental Google flow stores its own state", () => {
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");
    storePkceState("google-state", "google-verifier", "google-nonce", "google");

    expect(readPkceState("primary")).toEqual({
      state: "primary-state",
      codeVerifier: "primary-verifier",
      nonce: "primary-nonce",
    });
    expect(readPkceState("google")).toEqual({
      state: "google-state",
      codeVerifier: "google-verifier",
      nonce: "google-nonce",
    });
    expect(sessionStorage.getItem(OIDC_OAUTH_STATE_KEY)).toBe("primary-state");
    expect(sessionStorage.getItem(OIDC_GOOGLE_OAUTH_STATE_KEY)).toBe("google-state");
    expect(sessionStorage.getItem(OIDC_CODE_VERIFIER_KEY)).toBe("primary-verifier");
    expect(sessionStorage.getItem(OIDC_GOOGLE_CODE_VERIFIER_KEY)).toBe("google-verifier");
    expect(sessionStorage.getItem(OIDC_NONCE_KEY)).toBe("primary-nonce");
    expect(sessionStorage.getItem(OIDC_GOOGLE_NONCE_KEY)).toBe("google-nonce");
  });

  it("clears primary PKCE state when discovery fails before redirect", async () => {
    vi.doMock("@/lib/oidc/config", () => ({
      getOidcAuthority: () => "https://issuer.example",
      getOidcClientId: () => "client-id",
      getOidcRedirectUri: () => "https://app.example/auth/callback",
      getOidcScopes: () => "openid",
    }));
    vi.doMock("@/lib/oidc/pkce", () => ({
      createPkcePair: vi.fn(async () => ({ verifier: "verifier", challenge: "challenge" })),
      randomOpaqueState: vi.fn(() => "state"),
    }));
    vi.doMock("@/lib/oidc/discovery", () => ({
      loadDiscoveryDocument: vi.fn(async () => {
        throw new Error("discovery unavailable");
      }),
    }));

    const { initiateOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await expect(initiateOidcRedirect()).rejects.toThrow("discovery unavailable");
    expect(sessionStorage.getItem(OIDC_OAUTH_STATE_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_CODE_VERIFIER_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_NONCE_KEY)).toBeNull();
  });
});
