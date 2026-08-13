/** Contract-of-record facts for `/help/api-contracts` reference landing (HG). */
export const API_CONTRACTS_HELP_REFERENCE_LANDING = {
  purpose:
    "Versioned HTTP contract of record for integrators and Admin support — OpenAPI, auth, errors, and endpoint behavior.",
  // `v1` is the HTTP contract's own major version (`/v1/...`, `GET /openapi/v1.json`) — not a
  // product release label, so the buyer-copy version-label strip must not shorten it to "1.0".
  apiVersion: "v1.0 — major version segment in the URL path (`/v1/...`)",
  supportStatus: "Generally available HTTP contract",
  authScheme: "Entra ID bearer tokens and workspace API keys",
  errorFormat: "RFC 9457 Problem Details (`application/problem+json`)",
  paginationConvention: "Per-endpoint — see OpenAPI for cursor or offset patterns",
  deprecationWindow: "Sunset header per major version; breaking changes ship under a new `/v2/...` prefix",
  authoritativeSource: "GET /openapi/v1.json",
} as const;
