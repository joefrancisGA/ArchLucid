import { afterEach, describe, expect, it, vi } from "vitest";

import {
  OIDC_CODE_VERIFIER_KEY,
  OIDC_GOOGLE_CODE_VERIFIER_KEY,
  OIDC_GOOGLE_NONCE_KEY,
  OIDC_GOOGLE_OAUTH_STATE_KEY,
  OIDC_NONCE_KEY,
  OIDC_OAUTH_STATE_KEY,
  OIDC_POST_SIGN_IN_RETURN_URL_KEY,
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

  it("clears stale primary PKCE state when supplemental Google redirect succeeds", async () => {
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

    vi.doMock("@/lib/oidc/config", () => ({
      getOidcRedirectUri: () => "https://app.example/auth/callback",
    }));
    vi.doMock("@/lib/oidc/pkce", () => ({
      createPkcePair: vi.fn(async () => ({ verifier: "google-verifier", challenge: "challenge" })),
      randomOpaqueState: vi.fn(() => "google-state"),
    }));
    vi.doMock("@/lib/oidc/discovery", () => ({
      loadDiscoveryDocument: vi.fn(async () => ({
        issuer: "https://accounts.google.com",
        authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        token_endpoint: "https://oauth2.googleapis.com/token",
      })),
    }));
    vi.doMock("@/lib/oidc/build-authorize-url", () => ({
      buildAuthorizeUrl: vi.fn(() => "https://accounts.google.com/o/oauth2/v2/auth?state=google-state"),
    }));

    const { initiateSupplementalOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await initiateSupplementalOidcRedirect("google");

    expect(readPkceState("primary")).toBeNull();
    expect(readPkceState("google")).toEqual({
      state: "google-state",
      codeVerifier: "google-verifier",
      nonce: "google-state",
    });
    expect(assignMock).toHaveBeenCalled();
  });

  it("clears stale Google PKCE state when primary redirect succeeds", async () => {
    storePkceState("google-state", "google-verifier", "google-nonce", "google");

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

    vi.doMock("@/lib/oidc/config", () => ({
      getOidcAuthority: () => "https://issuer.example",
      getOidcClientId: () => "client-id",
      getOidcRedirectUri: () => "https://app.example/auth/callback",
      getOidcScopes: () => "openid",
    }));
    vi.doMock("@/lib/oidc/pkce", () => ({
      createPkcePair: vi.fn(async () => ({ verifier: "primary-verifier", challenge: "challenge" })),
      randomOpaqueState: vi.fn(() => "primary-state"),
    }));
    vi.doMock("@/lib/oidc/discovery", () => ({
      loadDiscoveryDocument: vi.fn(async () => ({
        issuer: "https://issuer.example",
        authorization_endpoint: "https://issuer.example/authorize",
        token_endpoint: "https://issuer.example/token",
      })),
    }));
    vi.doMock("@/lib/oidc/build-authorize-url", () => ({
      buildAuthorizeUrl: vi.fn(() => "https://issuer.example/authorize?state=primary-state"),
    }));

    const { initiateOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await initiateOidcRedirect();

    expect(readPkceState("google")).toBeNull();
    expect(readPkceState("primary")).toEqual({
      state: "primary-state",
      codeVerifier: "primary-verifier",
      nonce: "primary-state",
    });
    expect(assignMock).toHaveBeenCalled();
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

  it("clears the stored return path when discovery fails before redirect", async () => {
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

    await expect(initiateOidcRedirect("/architecture/reviews")).rejects.toThrow("discovery unavailable");
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
  });

  it("preserves an existing post-sign-in return path when supplemental Google discovery fails without a new return URL", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/primary-flow");
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    vi.doMock("@/lib/oidc/config", () => ({
      getOidcRedirectUri: () => "https://app.example/auth/callback",
    }));
    vi.doMock("@/lib/oidc/pkce", () => ({
      createPkcePair: vi.fn(async () => ({ verifier: "google-verifier", challenge: "challenge" })),
      randomOpaqueState: vi.fn(() => "google-state"),
    }));
    vi.doMock("@/lib/oidc/discovery", () => ({
      loadDiscoveryDocument: vi.fn(async () => {
        throw new Error("google discovery unavailable");
      }),
    }));

    const { initiateSupplementalOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await expect(initiateSupplementalOidcRedirect("google")).rejects.toThrow("google discovery unavailable");
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/primary-flow");
    expect(sessionStorage.getItem(OIDC_GOOGLE_OAUTH_STATE_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_OAUTH_STATE_KEY)).toBe("primary-state");
  });

  it("clears the post-sign-in return path when supplemental Google discovery fails after storing a return URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    vi.doMock("@/lib/oidc/config", () => ({
      getOidcRedirectUri: () => "https://app.example/auth/callback",
    }));
    vi.doMock("@/lib/oidc/pkce", () => ({
      createPkcePair: vi.fn(async () => ({ verifier: "google-verifier", challenge: "challenge" })),
      randomOpaqueState: vi.fn(() => "google-state"),
    }));
    vi.doMock("@/lib/oidc/discovery", () => ({
      loadDiscoveryDocument: vi.fn(async () => {
        throw new Error("google discovery unavailable");
      }),
    }));

    const { initiateSupplementalOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await expect(
      initiateSupplementalOidcRedirect("google", "/architecture/reviews/google-attempt"),
    ).rejects.toThrow("google discovery unavailable");
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
  });

  it("preserves post-sign-in return path when primary discovery fails but supplemental Google PKCE is pending", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/supplemental-flow");
    storePkceState("google-state", "google-verifier", "google-nonce", "google");

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
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/supplemental-flow");
    expect(sessionStorage.getItem(OIDC_GOOGLE_OAUTH_STATE_KEY)).toBe("google-state");
    expect(sessionStorage.getItem(OIDC_OAUTH_STATE_KEY)).toBeNull();
  });

  it("clears a stale return path when a later discovery attempt has no return URL", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/stale-review");
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
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
  });
});
