import { normalizeOidcConfigurationString } from "@/lib/oidc/oauth-callback-messages";

export type OidcDiscoveryDocument = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
};

const discoveryPromises = new Map<string, Promise<OidcDiscoveryDocument>>();

/** Rejects non-http(s) URLs and embedded userinfo credentials for OIDC endpoints and logout redirects. */
export function isSafeOidcEndpointUrl(url: string): boolean {
  return isHttpOrHttpsUrl(url);
}

function isHttpOrHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    // Embedded credentials in discovery endpoints would leak into browser navigation or server refresh calls.
    if (parsed.username.length > 0 || parsed.password.length > 0) {
      return false;
    }

    // Hash fragments are not sent on token POSTs and should not ride along on authorize navigation.
    if (parsed.hash.length > 0) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function parseDiscoveryDocument(body: unknown, discoveryUrl: string): OidcDiscoveryDocument {
  if (!body || typeof body !== "object") {
    throw new Error(`OIDC discovery document is not a JSON object: ${discoveryUrl}`);
  }

  const record = body as Record<string, unknown>;
  const issuerRaw = record.issuer;
  const authorizationEndpointRaw = record.authorization_endpoint;
  const tokenEndpointRaw = record.token_endpoint;

  if (
    typeof issuerRaw !== "string" ||
    typeof authorizationEndpointRaw !== "string" ||
    typeof tokenEndpointRaw !== "string"
  ) {
    throw new Error(`OIDC discovery document missing required endpoints: ${discoveryUrl}`);
  }

  const issuer = normalizeOidcConfigurationString(issuerRaw);
  const authorizationEndpoint = normalizeOidcConfigurationString(authorizationEndpointRaw);
  const tokenEndpoint = normalizeOidcConfigurationString(tokenEndpointRaw);

  if (issuer.length === 0 || authorizationEndpoint.length === 0 || tokenEndpoint.length === 0) {
    throw new Error(`OIDC discovery document missing required endpoints: ${discoveryUrl}`);
  }

  try {
    new URL(authorizationEndpoint);
    new URL(tokenEndpoint);
  } catch {
    throw new Error(`OIDC discovery document has invalid endpoint URLs: ${discoveryUrl}`);
  }

  if (!isHttpOrHttpsUrl(authorizationEndpoint) || !isHttpOrHttpsUrl(tokenEndpoint)) {
    throw new Error(`OIDC discovery document has invalid endpoint URLs: ${discoveryUrl}`);
  }

  const doc: OidcDiscoveryDocument = {
    issuer,
    authorization_endpoint: authorizationEndpoint,
    token_endpoint: tokenEndpoint,
  };

  const endSessionEndpoint = record.end_session_endpoint;

  if (typeof endSessionEndpoint === "string") {
    const trimmedEndSession = normalizeOidcConfigurationString(endSessionEndpoint);

    if (trimmedEndSession.length > 0) {
      try {
        new URL(trimmedEndSession);

        if (isHttpOrHttpsUrl(trimmedEndSession)) {
          doc.end_session_endpoint = trimmedEndSession;
        }
      } catch {
        /* optional logout endpoint must be a valid absolute URL */
      }
    }
  }

  return doc;
}

function discoveryUrlForAuthority(authority: string): string {
  const trimmed = normalizeOidcConfigurationString(authority);
  const withScheme = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withScheme);
  const pathname = parsed.pathname.replace(/\/+$/, "");

  return `${parsed.origin}${pathname}/.well-known/openid-configuration`;
}

export function loadDiscoveryDocument(authority: string): Promise<OidcDiscoveryDocument> {
  const url = discoveryUrlForAuthority(authority);
  const cached = discoveryPromises.get(url);

  if (cached) {
    return cached;
  }

  const promise = fetch(url, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`OIDC discovery failed (${response.status}): ${url}`);
      }

      const body = await response.json();

      return parseDiscoveryDocument(body, url);
    })
    .catch((error: unknown) => {
      discoveryPromises.delete(url);

      throw error;
    });

  discoveryPromises.set(url, promise);

  return promise;
}
