/** Shared HTTP helpers (JSON + proxy routing). */

export { ensureOidcBearerReady, getBearerToken, isBrowser, PROBLEM_DETAILS_AUDIENCE_HEADER } from "./http-auth";
export {
  applyCorrelationHeaders,
  browserProxyUrl,
  extractTraceId,
  resolveBinaryGetRequest,
  resolveRequest,
  withCorrelationHeaders,
} from "./http-proxy";

export type { ApiGetOptions, ApiResponseWithTrace } from "./http-verbs-get";
export { apiGet, apiGetJsonWithTrace, fetchArchLucidJson, throwApiRequestError } from "./http-verbs-get";
export {
  apiDelete,
  apiPatchJson,
  apiPostAcceptedWithLocation,
  apiPostJson,
  apiPostNoContent,
  apiPutJson,
  apiPutNoContent,
} from "./http-verbs-mutate";
