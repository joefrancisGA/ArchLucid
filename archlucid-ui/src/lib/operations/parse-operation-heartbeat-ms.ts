/** Parses GET /v1/operations heartbeatUtc for attempt-scoped stale-failure guards. */
export function parseOperationHeartbeatMs(heartbeatUtc: string | null | undefined): number | null {
  if (heartbeatUtc === null || heartbeatUtc === undefined || heartbeatUtc.trim().length === 0) {
    return null;
  }

  const parsed = Date.parse(heartbeatUtc);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}
