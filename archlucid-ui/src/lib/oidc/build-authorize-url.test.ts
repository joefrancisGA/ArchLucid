import { describe, expect, it } from "vitest";

import { buildAuthorizeUrl } from "@/lib/oidc/build-authorize-url";
import type { OidcDiscoveryDocument } from "@/lib/oidc/discovery";

const discoveryDoc: OidcDiscoveryDocument = {
  issuer: "https://login.example.com",
  authorization_endpoint: "https://login.example.com/oauth2/v2.0/authorize",
  token_endpoint: "https://login.example.com/oauth2/v2.0/token",
};

describe("buildAuthorizeUrl", () => {
  it("trims padded authorize query parameters before encoding", () => {
    const url = new URL(
      buildAuthorizeUrl({
        doc: discoveryDoc,
        clientId: "  client-1  ",
        redirectUri: "  https://app.example/callback  ",
        scope: "  openid profile  ",
        state: "  state-1  ",
        codeChallenge: "  challenge-1  ",
        nonce: "  nonce-1  ",
      }),
    );

    expect(url.searchParams.get("client_id")).toBe("client-1");
    expect(url.searchParams.get("redirect_uri")).toBe("https://app.example/callback");
    expect(url.searchParams.get("scope")).toBe("openid profile");
    expect(url.searchParams.get("state")).toBe("state-1");
    expect(url.searchParams.get("code_challenge")).toBe("challenge-1");
    expect(url.searchParams.get("nonce")).toBe("nonce-1");
  });
});
