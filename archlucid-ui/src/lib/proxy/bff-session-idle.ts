import {
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_IDLE_WORKING_TIMEOUT_MS,
} from "@/lib/auth/session-idle-timeout";

import type { BffSessionPayload } from "@/lib/proxy/bff-session-cookie";

export function resolveBffSessionIdleTimeoutMs(payload: BffSessionPayload): number {
  if (payload.wm === 1) {
    return SESSION_IDLE_WORKING_TIMEOUT_MS;
  }

  return SESSION_IDLE_TIMEOUT_MS;
}

export function isBffSessionIdleExpired(
  payload: BffSessionPayload,
  nowMs: number = Date.now(),
): boolean {
  const lastActivityAtMs = payload.la;

  if (!Number.isFinite(lastActivityAtMs) || lastActivityAtMs <= 0) {
    return true;
  }

  const idleTimeoutMs = resolveBffSessionIdleTimeoutMs(payload);

  return nowMs - lastActivityAtMs >= idleTimeoutMs;
}
