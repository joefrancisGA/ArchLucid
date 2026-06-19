/** Non-idempotent create path — callers must not auto-retry without an Idempotency-Key. */
export const ARCHITECTURE_REQUEST_CREATE_PATH = "/v1/architecture/request";

/** Operator-facing copy when create-run POST times out at the gateway. */
export const ARCHITECTURE_REQUEST_CREATE_TIMEOUT_MESSAGE =
  "Request timed out. Please check the Reviews list before resubmitting to avoid duplicates.";

export function isArchitectureRequestCreateGatewayTimeout(httpStatus: number): boolean {
  return httpStatus === 504 || httpStatus === 408;
}
