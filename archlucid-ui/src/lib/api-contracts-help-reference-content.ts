/** Contract-of-record facts for `/help/api-contracts` reference landing (HG). */
export const API_CONTRACTS_HELP_REFERENCE_LANDING = {
  purpose:
    "Versioned HTTP contract of record for integrators and Admin support — OpenAPI, auth, errors, and endpoint behavior.",
  apiVersion: "v1.0 — major version in URL path (`/v1/...`)",
  supportStatus: "Generally available — V1 GA HTTP contract",
  authScheme: "Entra ID bearer tokens and workspace API keys",
  errorFormat: "RFC 9457 Problem Details (`application/problem+json`)",
  paginationConvention: "Per-endpoint — see OpenAPI for cursor or offset patterns",
  deprecationWindow: "Sunset header per major version; breaking changes ship under a new `/v2/...` prefix",
  authoritativeSource: "GET /openapi/v1.json",
} as const;
