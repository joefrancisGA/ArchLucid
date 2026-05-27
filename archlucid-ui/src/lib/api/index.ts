/**
 * Typed JSON access to `/v1/...` plus proxy/binary helpers.
 * For a compact **current principal** read-model (`GET /api/proxy/api/auth/me`), use `@/lib/current-principal`
 * instead of adding ad-hoc identity fetches here.
 */
export type { ApiResponseWithTrace } from "./http";
export {
  apiDelete,
  apiGet,
  apiPostJson,
  apiPostNoContent,
  apiPutNoContent,
  extractTraceId,
  fetchArchLucidJson,
} from "./http";
export * from "./tenant-customer-success";
export * from "./architecture-runs";
export * from "./architecture-request-draft-api";
export * from "./policy-pack-draft-api";
export * from "./run-summary-export-api";
export * from "./finding-ask-api";
export * from "./pilots-marketing";
export * from "./findings-api";
export * from "./conversation-api";
export * from "./learning-evolution-api";
export * from "./advisory-digests-api";
export * from "./alerts-api";
export * from "./audit-api";
export * from "./policy-governance-api";
export * from "./governance-stickiness-api";
export * from "./recommendation-replay-api";
export * from "./comparison-replay-cost-api";
export * from "./downloads-api";
export * from "./reports-api";
