import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_IDLE_WORKING_TIMEOUT_MS,
} from "@/lib/auth/session-idle-timeout";
import type { BffSessionPayload } from "@/lib/proxy/bff-session-cookie";
import { isBffSessionIdleExpired, resolveBffSessionIdleTimeoutMs } from "@/lib/proxy/bff-session-idle";

function buildPayload(overrides?: Partial<BffSessionPayload>): BffSessionPayload {
  return {
    v: 2,
    at: "access-token",
    exp: Date.now() + 3_600_000,
    la: Date.now(),
    csrf: "csrf-token",
    wm: 1,
    ...overrides,
  };
}

describe("bff-session-idle (LK-07)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the 4h Working idle ceiling when wm=1", () => {
    expect(resolveBffSessionIdleTimeoutMs(buildPayload({ wm: 1 }))).toBe(SESSION_IDLE_WORKING_TIMEOUT_MS);
  });

  it("uses the 1h Guided idle ceiling when wm=0", () => {
    expect(resolveBffSessionIdleTimeoutMs(buildPayload({ wm: 0 }))).toBe(SESSION_IDLE_TIMEOUT_MS);
  });

  it("expires Working sessions after 4h of inactivity", () => {
    const now = Date.now();
    const payload = buildPayload({ wm: 1, la: now - SESSION_IDLE_WORKING_TIMEOUT_MS });

    expect(isBffSessionIdleExpired(payload, now)).toBe(true);
  });

  it("keeps Working sessions alive inside the 4h window", () => {
    const now = Date.now();
    const payload = buildPayload({ wm: 1, la: now - SESSION_IDLE_WORKING_TIMEOUT_MS + 60_000 });

    expect(isBffSessionIdleExpired(payload, now)).toBe(false);
  });
});
