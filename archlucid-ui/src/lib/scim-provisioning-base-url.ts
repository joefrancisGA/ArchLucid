/** Customer-facing SCIM base URL path segment (via UI proxy). */
export const SCIM_PROXY_BASE_PATH = "/api/proxy/scim/v2";

/** Internal path used for connectivity verification — not shown in customer copy. */
export const SCIM_SERVICE_PROVIDER_CONFIG_PATH = `${SCIM_PROXY_BASE_PATH}/ServiceProviderConfig`;

export function resolveScimBaseUrl(origin: string): string {
  const trimmed = origin.trim();

  if (trimmed.length === 0) {
    return SCIM_PROXY_BASE_PATH;
  }

  const normalizedOrigin = trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;

  return `${normalizedOrigin}${SCIM_PROXY_BASE_PATH}`;
}

export type ScimBaseUrlClassification = {
  readonly url: string;
  readonly isLoopbackHost: boolean;
  readonly isNonHttpsScheme: boolean;
  readonly requiresExternalReachabilityWarning: boolean;
};

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();

  if (normalized.length === 0) {
    return false;
  }

  return LOOPBACK_HOSTNAMES.has(normalized);
}

/** Flags loopback hosts and non-HTTPS origins that external IdPs cannot reach. */
export function classifyScimBaseUrl(origin: string): ScimBaseUrlClassification {
  const url = resolveScimBaseUrl(origin);

  if (origin.trim().length === 0) {
    return {
      url,
      isLoopbackHost: false,
      isNonHttpsScheme: false,
      requiresExternalReachabilityWarning: false,
    };
  }

  try {
    const parsed = new URL(url);
    const isLoopbackHost = isLoopbackHostname(parsed.hostname);
    const isNonHttpsScheme = parsed.protocol === "http:";

    return {
      url,
      isLoopbackHost,
      isNonHttpsScheme,
      requiresExternalReachabilityWarning: isLoopbackHost || isNonHttpsScheme,
    };
  } catch {
    return {
      url,
      isLoopbackHost: false,
      isNonHttpsScheme: false,
      requiresExternalReachabilityWarning: false,
    };
  }
}
