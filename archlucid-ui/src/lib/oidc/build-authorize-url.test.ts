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

  it("retains B2C policy query parameters from the discovery authorization endpoint", () => {
    const b2cDoc: OidcDiscoveryDocument = {
      issuer: "https://contoso.b2clogin.com/00000000-0000-0000-0000-000000000000/v2.0/",
      authorization_endpoint:
        "https://contoso.b2clogin.com/contoso.onmicrosoft.com/B2C_1_signin/oauth2/v2.0/authorize?p=B2C_1_signin",
      token_endpoint:
        "https://contoso.b2clogin.com/contoso.onmicrosoft.com/B2C_1_signin/oauth2/v2.0/token?p=B2C_1_signin",
    };

    const url = new URL(
      buildAuthorizeUrl({
        doc: b2cDoc,
        clientId: "client-1",
        redirectUri: "https://app.example/callback",
        scope: "openid profile",
        state: "state-1",
        codeChallenge: "challenge-1",
        nonce: "nonce-1",
      }),
    );

    expect(url.searchParams.get("p")).toBe("B2C_1_signin");
    expect(url.searchParams.get("client_id")).toBe("client-1");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("overwrites discovery response_mode with query because the SPA callback expects query parameters", () => {
    const docWithFragmentMode: OidcDiscoveryDocument = {
      ...discoveryDoc,
      authorization_endpoint: "https://login.example.com/oauth2/v2.0/authorize?response_mode=fragment",
    };

    const url = new URL(
      buildAuthorizeUrl({
        doc: docWithFragmentMode,
        clientId: "client-1",
        redirectUri: "https://app.example/callback",
        scope: "openid profile",
        state: "state-1",
        codeChallenge: "challenge-1",
        nonce: "nonce-1",
      }),
    );

    expect(url.searchParams.get("response_mode")).toBe("query");
  });

  it("overwrites duplicate query keys on the discovery authorization endpoint with ArchLucid values", () => {
    const docWithStaleClientId: OidcDiscoveryDocument = {
      ...discoveryDoc,
      authorization_endpoint: "https://login.example.com/oauth2/v2.0/authorize?client_id=stale-id&p=B2C_1_signin",
    };

    const url = new URL(
      buildAuthorizeUrl({
        doc: docWithStaleClientId,
        clientId: "client-1",
        redirectUri: "https://app.example/callback",
        scope: "openid profile",
        state: "state-1",
        codeChallenge: "challenge-1",
        nonce: "nonce-1",
      }),
    );

    expect(url.searchParams.get("p")).toBe("B2C_1_signin");
    expect(url.searchParams.get("client_id")).toBe("client-1");
  });

  it("strips zero-width characters from authorize query parameters before encoding", () => {
    const url = new URL(
      buildAuthorizeUrl({
        doc: discoveryDoc,
        clientId: "\u200bclient-1\u200b",
        redirectUri: "https://app.example/callback\u200b",
        scope: "openid\u200b profile",
        state: "state-1\u200b",
        codeChallenge: "challenge-1\u200b",
        nonce: "nonce-1\u200b",
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
