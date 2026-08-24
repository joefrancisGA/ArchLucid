export type OidcDiscoveryDocument = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
};

const discoveryPromises = new Map<string, Promise<OidcDiscoveryDocument>>();

function parseDiscoveryDocument(body: unknown, discoveryUrl: string): OidcDiscoveryDocument {
  if (!body || typeof body !== "object") {
    throw new Error(`OIDC discovery document is not a JSON object: ${discoveryUrl}`);
  }

  const record = body as Record<string, unknown>;
  const issuer = record.issuer;
  const authorizationEndpoint = record.authorization_endpoint;
  const tokenEndpoint = record.token_endpoint;

  if (
    typeof issuer !== "string" ||
    issuer.trim().length === 0 ||
    typeof authorizationEndpoint !== "string" ||
    authorizationEndpoint.trim().length === 0 ||
    typeof tokenEndpoint !== "string" ||
    tokenEndpoint.trim().length === 0
  ) {
    throw new Error(`OIDC discovery document missing required endpoints: ${discoveryUrl}`);
  }

  try {
    new URL(authorizationEndpoint);
    new URL(tokenEndpoint);
  } catch {
    throw new Error(`OIDC discovery document has invalid endpoint URLs: ${discoveryUrl}`);
  }

  const doc: OidcDiscoveryDocument = {
    issuer: issuer.trim(),
    authorization_endpoint: authorizationEndpoint.trim(),
    token_endpoint: tokenEndpoint.trim(),
  };

  const endSessionEndpoint = record.end_session_endpoint;

  if (typeof endSessionEndpoint === "string" && endSessionEndpoint.trim().length > 0) {
    doc.end_session_endpoint = endSessionEndpoint.trim();
  }

  return doc;
}

function discoveryUrlForAuthority(authority: string): string {
  const trimmed = authority.trim();
  const withScheme = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  const base = withScheme.replace(/\/+$/, "");

  return `${base}/.well-known/openid-configuration`;
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
