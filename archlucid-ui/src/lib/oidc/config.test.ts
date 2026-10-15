import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getGoogleOidcAuthority,
  getGoogleOidcClientId,
  getGoogleOidcScopes,
  getOidcAuthority,
  getOidcClientId,
  getOidcRedirectUri,
} from "@/lib/oidc/config";

describe("oidc config env normalization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("strips zero-width padding from OIDC authority and client id env values", () => {
    vi.stubEnv("NEXT_PUBLIC_OIDC_AUTHORITY", `\u200bhttps://login.example.com/tenant\u200b`);
    vi.stubEnv("NEXT_PUBLIC_OIDC_CLIENT_ID", `\u200bclient-1\u200b`);

    expect(getOidcAuthority()).toBe("https://login.example.com/tenant");
    expect(getOidcClientId()).toBe("client-1");
  });

  it("strips zero-width padding from Google OIDC env values", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY", `\u200bhttps://accounts.google.com\u200b`);
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID", `\u200bgoogle-client\u200b`);
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OIDC_SCOPES", `openid\u200b profile email`);

    expect(getGoogleOidcAuthority()).toBe("https://accounts.google.com");
    expect(getGoogleOidcClientId()).toBe("google-client");
    expect(getGoogleOidcScopes()).toBe("openid profile email");
  });

  it("falls back to the runtime origin redirect URI when the env override is whitespace-only", () => {
    vi.stubEnv("NEXT_PUBLIC_OIDC_REDIRECT_URI", "   \u200b  ");

    expect(getOidcRedirectUri()).toBe("http://localhost:3000/auth/callback");
  });
});
