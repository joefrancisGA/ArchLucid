import { afterEach, describe, expect, it, vi } from "vitest";

import {
  readSharedSessionLastActivityAtMs,
  resolveSessionIdleTimeoutMs,
  remainingSessionIdleMs,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_IDLE_WORKING_TIMEOUT_MS,
  SESSION_LAST_ACTIVITY_STORAGE_KEY,
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

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.removeItem(SESSION_LAST_ACTIVITY_STORAGE_KEY);
  });

  it("treats a future last-activity timestamp as already idle", () => {
    const nowMs = Date.parse("2026-11-23T18:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(nowMs);
    window.localStorage.setItem(SESSION_LAST_ACTIVITY_STORAGE_KEY, "2099-01-01T00:00:00.000Z");

    expect(readSharedSessionLastActivityAtMs()).toBe(nowMs - SESSION_IDLE_WORKING_TIMEOUT_MS);
    expect(
      remainingSessionIdleMs(
        readSharedSessionLastActivityAtMs(),
        nowMs,
        SESSION_IDLE_WORKING_TIMEOUT_MS,
      ),
    ).toBe(0);
  });
});
