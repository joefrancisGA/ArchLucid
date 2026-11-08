import { afterEach, describe, expect, it, vi } from "vitest";

import {
  OIDC_CODE_VERIFIER_KEY,
  OIDC_GOOGLE_CODE_VERIFIER_KEY,
  OIDC_GOOGLE_NONCE_KEY,
  OIDC_GOOGLE_OAUTH_STATE_KEY,
  OIDC_NONCE_KEY,
  OIDC_OAUTH_STATE_KEY,
  OIDC_AUTHORIZE_CALLBACK_FAILED_KEY,
  OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY,
  OIDC_POST_SIGN_IN_RETURN_URL_KEY,
  OIDC_USER_SUBJECT_KEY,
} from "@/lib/oidc/storage-keys";
import {
  clearIdleDeskRestorePayload,
  IDLE_DESK_RESTORE_STORAGE_KEY,
  persistIdleDeskRestoreBeforeSessionClear,
} from "@/lib/auth/idle-desk-restore";
import {
  clearOperatorScopeStorage,
  writeOperatorScopeToStorage,
} from "@/lib/operator/operator-scope-storage";
import {
  clearOidcSession,
  consumePostSignInReturnUrl,
  markAuthorizeCallbackFailed,
  readPkceState,
  storePostSignInReturnUrl,
  storePkceState,
} from "@/lib/oidc/session";

function mockOidcConfigWithRedirectUri(): void {
  vi.doMock("@/lib/oidc/config", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/oidc/config")>();

    return {
      ...actual,
      getOidcRedirectUri: () => "https://app.example/auth/callback",
    };
  });
}

describe("initiate redirect PKCE isolation", () => {
  afterEach(() => {
    sessionStorage.clear();
    clearIdleDeskRestorePayload();
    clearOperatorScopeStorage();
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

  it("strips zero-width padding from Google OIDC env before discovery and authorize", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", `https://accounts.google.com\u200b`);
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", `google-client\u200b`);
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_SCOPES", `openid\u200b profile email`);

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

    const loadDiscoveryDocument = vi.fn(async () => ({
      issuer: "https://accounts.google.com",
      authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      token_endpoint: "https://oauth2.googleapis.com/token",
    }));
    const buildAuthorizeUrl = vi.fn(() => "https://accounts.google.com/o/oauth2/v2/auth?state=google-state");

    mockOidcConfigWithRedirectUri();
    vi.doMock("@/lib/oidc/pkce", () => ({
      createPkcePair: vi.fn(async () => ({ verifier: "google-verifier", challenge: "challenge" })),
      randomOpaqueState: vi.fn(() => "google-state"),
    }));
    vi.doMock("@/lib/oidc/discovery", () => ({
      loadDiscoveryDocument,
    }));
    vi.doMock("@/lib/oidc/build-authorize-url", () => ({
      buildAuthorizeUrl,
    }));

    const { initiateSupplementalOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await initiateSupplementalOidcRedirect("google");

    expect(loadDiscoveryDocument).toHaveBeenCalledWith("https://accounts.google.com");
    expect(buildAuthorizeUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "google-client",
        scope: "openid profile email",
      }),
    );
    expect(assignMock).toHaveBeenCalled();
  });

  it("clears stale primary PKCE state when supplemental Google redirect succeeds", async () => {
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

    mockOidcConfigWithRedirectUri();
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

  it("clears stale post-sign-in return path when primary redirect gets an empty return URL", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/stale-review");

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

    await initiateOidcRedirect("");

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(assignMock).toHaveBeenCalled();
  });

  it("clears stale post-sign-in return when primary redirect starts without a return URL while orphaned Google PKCE remains", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/stale-review");
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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(readPkceState("google")).toBeNull();
    expect(assignMock).toHaveBeenCalled();
  });

  it("preserves idle-desk restore return path when session hint query order differs", async () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-b",
      projectId: "project-c",
      workspaceLabel: "Payments",
      projectLabel: "Primary",
    });
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/run-1?reviewTab=findings&runId=abc");
    sessionStorage.setItem(
      OIDC_POST_SIGN_IN_RETURN_URL_KEY,
      "/architecture/reviews/run-1?runId=abc&reviewTab=findings",
    );

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe(
      "/architecture/reviews/run-1?runId=abc&reviewTab=findings",
    );
    expect(assignMock).toHaveBeenCalled();
  });

  it("preserves idle-desk restore return path when operator scope is missing before session clear", async () => {
    clearOperatorScopeStorage();
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/run-1");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("preserves idle-desk restore return path when session hint differs only by a trailing slash", async () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-b",
      projectId: "project-c",
      workspaceLabel: "Payments",
      projectLabel: "Primary",
    });
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/run-1");
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-1/");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-1/");
    expect(localStorage.getItem(IDLE_DESK_RESTORE_STORAGE_KEY)).not.toBeNull();
    expect(assignMock).toHaveBeenCalled();
  });

  it("preserves idle-desk restore return path when primary redirect starts without a return URL", async () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-b",
      projectId: "project-c",
      workspaceLabel: "Payments",
      projectLabel: "Primary",
    });
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/run-1?reviewTab=findings");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe(
      "/architecture/reviews/run-1?reviewTab=findings",
    );
    expect(assignMock).toHaveBeenCalled();
  });

  it("preserves post-sign-in return path when retrying after an incomplete authorize callback", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-2");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-2");
    expect(assignMock).toHaveBeenCalled();
  });

  it("preserves post-sign-in return path when retrying after an authorize callback OAuth error", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-1");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-1");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("preserves post-sign-in return path when a prior authorize retry reached the IdP but was abandoned", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-abandon");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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
    expect(assignMock).toHaveBeenCalledTimes(1);

    vi.resetModules();
    assignMock.mockClear();

    const { initiateOidcRedirect: initiateAgain } = await import("@/lib/oidc/initiate-redirect");

    await initiateAgain();

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-abandon");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalledTimes(1);
  });

  it("preserves authorize-retry return snapshot when sign-in restarts during authorize retry without returnUrl", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/snapshot-keep");
    markAuthorizeCallbackFailed();

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY)).toBe(
      "/architecture/reviews/snapshot-keep",
    );

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

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY)).toBe(
      "/architecture/reviews/snapshot-keep",
    );
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("purges a zero-width-only post-sign-in return URL when sign-in starts during authorize retry", async () => {
    clearIdleDeskRestorePayload();
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "\u200b\u200b");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("purges a poisoned post-sign-in return URL when sign-in starts during authorize retry", async () => {
    clearIdleDeskRestorePayload();
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("rehydrates idle-desk return path when authorize-retry snapshot is unsafe and post-sign-in storage is empty", async () => {
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/idle-after-bad-snapshot");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");
    sessionStorage.setItem(OIDC_AUTHORIZE_RETRY_RETURN_PATH_KEY, "https://evil.example/phish");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe(
      "/architecture/reviews/idle-after-bad-snapshot",
    );
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("rehydrates authorize-retry snapshot when primary sign-in starts during retry with in-flight Google PKCE and a tampered unsafe URL", async () => {
    storePostSignInReturnUrl("/architecture/reviews/run-google-pkce");
    markAuthorizeCallbackFailed();
    storePkceState("google-state", "google-verifier", "google-nonce", "google");
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-google-pkce");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("prefers authorize-retry return snapshot over stale idle-desk backup after purging a tampered unsafe URL", async () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-b",
      projectId: "project-c",
      workspaceLabel: "Payments",
      projectLabel: "Primary",
    });
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/run-stale-idle");
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-active");
    markAuthorizeCallbackFailed();
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-active");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("rehydrates authorize-retry return snapshot after unsafe consume purges a tampered post-sign-in URL", async () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-b",
      projectId: "project-c",
      workspaceLabel: "Payments",
      projectLabel: "Primary",
    });
    storePostSignInReturnUrl("/architecture/reviews/run-consume-rehydrate");
    markAuthorizeCallbackFailed();
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");

    expect(consumePostSignInReturnUrl()).toBeNull();

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe(
      "/architecture/reviews/run-consume-rehydrate",
    );
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("rehydrates idle-desk return path when authorize retry survives purging a tampered unsafe return URL", async () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-b",
      projectId: "project-c",
      workspaceLabel: "Payments",
      projectLabel: "Primary",
    });
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/run-tamper");
    markAuthorizeCallbackFailed();
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-tamper");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("purges a poisoned post-sign-in return URL when supplemental Google sign-in starts during authorize retry", async () => {
    clearIdleDeskRestorePayload();
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("rehydrates authorize-retry snapshot when supplemental Google sign-in starts during retry with in-flight primary PKCE and a tampered unsafe URL", async () => {
    storePostSignInReturnUrl("/architecture/reviews/run-primary-pkce");
    markAuthorizeCallbackFailed();
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe(
      "/architecture/reviews/run-primary-pkce",
    );
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("rehydrates supplemental Google sign-in return path when authorize retry survives purging a tampered unsafe URL", async () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-b",
      projectId: "project-c",
      workspaceLabel: "Payments",
      projectLabel: "Primary",
    });
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/google-tamper");
    markAuthorizeCallbackFailed();
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/google-tamper");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("purges a poisoned post-sign-in return URL when Google supplemental sign-in starts during authorize retry", async () => {
    clearIdleDeskRestorePayload();
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("prefers authorize-retry return snapshot over stale idle-desk backup for Google supplemental sign-in after purging a tampered unsafe URL", async () => {
    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-b",
      projectId: "project-c",
      workspaceLabel: "Payments",
      projectLabel: "Primary",
    });
    persistIdleDeskRestoreBeforeSessionClear("/architecture/reviews/google-stale-idle");
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/google-active");
    markAuthorizeCallbackFailed();
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/google-active");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("rehydrates authorize-retry snapshot when Google supplemental sign-in starts during retry with in-flight primary PKCE and a tampered unsafe URL", async () => {
    storePostSignInReturnUrl("/architecture/reviews/run-primary-pkce");
    markAuthorizeCallbackFailed();
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-primary-pkce");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("purges a tampered unsafe return URL and keeps authorize retry when discovery fails before redirect", async () => {
    clearIdleDeskRestorePayload();
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("clears authorize retry marker when retry uses a different explicit return URL", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-old");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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

    await initiateOidcRedirect("/architecture/reviews/run-new");

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-new");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
    expect(assignMock).toHaveBeenCalled();
  });

  it("clears authorize retry marker when supplemental Google retry uses a different explicit return URL", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-old");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();
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

    await initiateSupplementalOidcRedirect("google", "/architecture/reviews/run-new");

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-new");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBeNull();
    expect(assignMock).toHaveBeenCalled();
  });

  it("re-marks authorize retry when discovery fails after changing explicit return URL during authorize-callback retry", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-old");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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
      loadDiscoveryDocument: vi.fn(async () => {
        throw new Error("discovery unavailable");
      }),
    }));

    const { initiateOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await expect(initiateOidcRedirect("/architecture/reviews/run-new")).rejects.toThrow("discovery unavailable");
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-new");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("preserves a new return path after discovery failure when authorize retry changed explicit return URL then sign-in omits returnUrl", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-old");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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
      loadDiscoveryDocument: vi.fn(async () => {
        throw new Error("discovery unavailable");
      }),
    }));

    const { initiateOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await expect(initiateOidcRedirect("/architecture/reviews/run-new")).rejects.toThrow("discovery unavailable");

    vi.resetModules();

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
      loadDiscoveryDocument: vi.fn(async () => ({
        issuer: "https://issuer.example",
        authorization_endpoint: "https://issuer.example/authorize",
        token_endpoint: "https://issuer.example/token",
      })),
    }));
    vi.doMock("@/lib/oidc/build-authorize-url", () => ({
      buildAuthorizeUrl: vi.fn(() => "https://issuer.example/authorize?state=state"),
    }));

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

    const { initiateOidcRedirect: initiateAgain } = await import("@/lib/oidc/initiate-redirect");

    await initiateAgain();

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-new");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("preserves a new return path after supplemental Google discovery failure when authorize retry changed explicit return URL then sign-in omits returnUrl", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-old");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();
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
      initiateSupplementalOidcRedirect("google", "/architecture/reviews/run-new"),
    ).rejects.toThrow("google discovery unavailable");

    vi.resetModules();

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();
    vi.doMock("@/lib/oidc/pkce", () => ({
      createPkcePair: vi.fn(async () => ({ verifier: "google-verifier-2", challenge: "challenge" })),
      randomOpaqueState: vi.fn(() => "google-state-2"),
    }));
    vi.doMock("@/lib/oidc/discovery", () => ({
      loadDiscoveryDocument: vi.fn(async () => ({
        issuer: "https://accounts.google.com",
        authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        token_endpoint: "https://oauth2.googleapis.com/token",
      })),
    }));
    vi.doMock("@/lib/oidc/build-authorize-url", () => ({
      buildAuthorizeUrl: vi.fn(() => "https://accounts.google.com/o/oauth2/v2/auth?state=google-state-2"),
    }));

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

    const { initiateSupplementalOidcRedirect: initiateGoogleAgain } = await import(
      "@/lib/oidc/initiate-redirect"
    );

    await initiateGoogleAgain("google");

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-new");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("does not consume authorize retry marker when explicit returnUrl matches stored path with reordered query params", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-1?b=2&a=1");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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

    await initiateOidcRedirect("/architecture/reviews/run-1?a=1&b=2");

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe(
      "/architecture/reviews/run-1?a=1&b=2",
    );
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("does not consume authorize retry marker when explicit returnUrl repeats stored path differing only by trailing slash", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-1/");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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

    await initiateOidcRedirect("/architecture/reviews/run-1");

    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });

  it("preserves post-sign-in return path when authorize retry repeats the same explicit return URL then user abandons IdP", async () => {
    const returnPath = "/architecture/reviews/run-abandon-explicit";
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, returnPath);
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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

    await initiateOidcRedirect(returnPath);
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");

    vi.resetModules();
    assignMock.mockClear();

    const { initiateOidcRedirect: initiateAgain } = await import("@/lib/oidc/initiate-redirect");

    await initiateAgain();

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe(returnPath);
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalledTimes(1);
  });

  it("preserves post-sign-in return path when supplemental Google discovery fails during authorize-callback retry", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-3");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();
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
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-3");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("preserves post-sign-in return path when discovery fails during authorize-callback retry", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-3");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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
      loadDiscoveryDocument: vi.fn(async () => {
        throw new Error("discovery unavailable");
      }),
    }));

    const { initiateOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await expect(initiateOidcRedirect()).rejects.toThrow("discovery unavailable");
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-3");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("preserves post-sign-in return path when discovery fails during authorize retry with the same explicit return URL", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/run-3");
    sessionStorage.setItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY, "1");

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
      loadDiscoveryDocument: vi.fn(async () => {
        throw new Error("discovery unavailable");
      }),
    }));

    const { initiateOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await expect(initiateOidcRedirect("/architecture/reviews/run-3")).rejects.toThrow("discovery unavailable");
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBe("/architecture/reviews/run-3");
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
  });

  it("clears stale post-sign-in return path when primary redirect succeeds without a return URL", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/stale-review");

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

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
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

  it("clears stale post-sign-in return when supplemental Google starts without a return URL after abandoning primary PKCE", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/architecture/reviews/primary-flow");
    storePkceState("primary-state", "primary-verifier", "primary-nonce", "primary");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();
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
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_GOOGLE_OAUTH_STATE_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_OAUTH_STATE_KEY)).toBeNull();
  });

  it("clears the post-sign-in return path when supplemental Google discovery fails after storing a return URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();
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

  it("clears stale post-sign-in return after sign-out even when authorize callback retry was pending", async () => {
    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-123");
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/stale-review");
    markAuthorizeCallbackFailed();
    clearOidcSession();
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/stale-review");

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

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
      loadDiscoveryDocument: vi.fn(async () => ({
        issuer: "https://issuer.example",
        authorization_endpoint: "https://issuer.example/authorize",
        token_endpoint: "https://issuer.example/token",
      })),
    }));
    vi.doMock("@/lib/oidc/build-authorize-url", () => ({
      buildAuthorizeUrl: vi.fn(() => "https://issuer.example/authorize?state=state"),
    }));

    const { initiateOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await initiateOidcRedirect();

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(assignMock).toHaveBeenCalled();
  });

  it("clears stale post-sign-in return when primary OIDC starts without a return URL after abandoning Google PKCE", async () => {
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
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_GOOGLE_OAUTH_STATE_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_OAUTH_STATE_KEY)).toBeNull();
  });

  it("clears a stale return path when supplemental Google discovery fails without primary PKCE pending", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "/stale-review");

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", "https://accounts.google.com");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", "google-client");
    mockOidcConfigWithRedirectUri();
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
    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
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

  it("purges a tampered unsafe post-sign-in return URL when authorize retry is pending", async () => {
    sessionStorage.setItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY, "https://evil.example/phish");
    markAuthorizeCallbackFailed();

    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

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
      loadDiscoveryDocument: vi.fn(async () => ({
        issuer: "https://issuer.example",
        authorization_endpoint: "https://issuer.example/authorize",
        token_endpoint: "https://issuer.example/token",
      })),
    }));
    vi.doMock("@/lib/oidc/build-authorize-url", () => ({
      buildAuthorizeUrl: vi.fn(() => "https://issuer.example/authorize?state=state"),
    }));

    const { initiateOidcRedirect } = await import("@/lib/oidc/initiate-redirect");

    await initiateOidcRedirect();

    expect(sessionStorage.getItem(OIDC_POST_SIGN_IN_RETURN_URL_KEY)).toBeNull();
    expect(sessionStorage.getItem(OIDC_AUTHORIZE_CALLBACK_FAILED_KEY)).toBe("1");
    expect(assignMock).toHaveBeenCalled();
  });
});
