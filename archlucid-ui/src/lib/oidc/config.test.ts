import { afterEach, describe, expect, it, vi } from "vitest";

import { getOidcAuthority, getOidcClientId } from "@/lib/oidc/config";

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
});
