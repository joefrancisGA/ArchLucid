import type { OidcDiscoveryDocument } from "@/lib/oidc/discovery";
import { normalizeOidcConfigurationString } from "@/lib/oidc/oauth-callback-messages";

function trimAuthorizeQueryValue(value: string): string {
  return normalizeOidcConfigurationString(value);
}

export function buildAuthorizeUrl(params: {
  doc: OidcDiscoveryDocument;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
  nonce: string;
}): string {
  // Retain IdP-specific query keys from discovery (e.g. Azure AD B2C `p=` policy) — ArchLucid params win on name collision.
  const url = new URL(params.doc.authorization_endpoint);

  url.searchParams.set("client_id", trimAuthorizeQueryValue(params.clientId));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", trimAuthorizeQueryValue(params.redirectUri));
  url.searchParams.set("scope", trimAuthorizeQueryValue(params.scope));
  url.searchParams.set("state", trimAuthorizeQueryValue(params.state));
  url.searchParams.set("nonce", trimAuthorizeQueryValue(params.nonce));
  url.searchParams.set("code_challenge", trimAuthorizeQueryValue(params.codeChallenge));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("response_mode", "query");

  return url.toString();
}
