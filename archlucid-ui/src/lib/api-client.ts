/**
 * Browser/server JSON client for ArchLucid API calls (implementation in `api/http.ts`).
 * Assessment and docs may refer to this module name; keep exports aligned with `throwApiRequestError`.
 */
export {
  apiDelete,
  apiGet,
  apiGetJsonWithTrace,
  apiPostJson,
  apiPostNoContent,
  apiPutNoContent,
  ensureOidcBearerReady,
  fetchArchLucidJson,
  getBearerToken,
  isBrowser,
  resolveBinaryGetRequest,
  resolveRequest,
  throwApiRequestError,
  withCorrelationHeaders,
} from "@/lib/api/http";
