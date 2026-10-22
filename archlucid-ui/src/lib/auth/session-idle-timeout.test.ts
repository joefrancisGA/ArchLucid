import { describe, expect, it } from "vitest";

import {
  resolveSessionIdleTimeoutMs,
  remainingSessionIdleMs,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_IDLE_WORKING_TIMEOUT_MS,
} from "@/lib/auth/session-idle-timeout";

describe("session-idle-timeout", () => {
  it("resolveSessionIdleTimeoutMs returns longer ceiling for Working mode", () => {
    expect(resolveSessionIdleTimeoutMs(false)).toBe(SESSION_IDLE_TIMEOUT_MS);
    expect(resolveSessionIdleTimeoutMs(true)).toBe(SESSION_IDLE_WORKING_TIMEOUT_MS);
  });

  it("remainingSessionIdleMs respects custom idle timeout", () => {
    const now = 1_000_000;
    const last = now - SESSION_IDLE_WORKING_TIMEOUT_MS + 5_000;

    expect(
      remainingSessionIdleMs(last, now, SESSION_IDLE_WORKING_TIMEOUT_MS),
    ).toBe(5_000);
  });
});
