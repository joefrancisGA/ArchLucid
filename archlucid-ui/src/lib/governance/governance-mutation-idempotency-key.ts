/** Creates a fresh idempotency key for a single governance mutation attempt (retries reuse the same key). */
export function createGovernanceMutationIdempotencyKey(): string {
  return crypto.randomUUID();
}
