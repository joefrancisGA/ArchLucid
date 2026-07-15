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
