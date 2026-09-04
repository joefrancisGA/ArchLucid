import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const ensureAccessTokenFreshMock = vi.hoisted(() => vi.fn(async () => undefined));
const writeSharedSessionLastActivityAtMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/oidc/session", () => ({
  ensureAccessTokenFresh: ensureAccessTokenFreshMock,
}));

vi.mock("@/lib/auth/session-idle-timeout", () => ({
  SESSION_IDLE_FOCUS_HEARTBEAT_MS: 50,
  writeSharedSessionLastActivityAt: writeSharedSessionLastActivityAtMock,
}));

import { pulseOidcSessionKeepalive, useOidcSessionKeepalive } from "@/hooks/use-oidc-session-keepalive";

describe("useOidcSessionKeepalive", () => {
  beforeEach(() => {
    ensureAccessTokenFreshMock.mockClear();
    writeSharedSessionLastActivityAtMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pulses activity and token refresh when enabled", () => {
    renderHook(() => useOidcSessionKeepalive(true));

    expect(writeSharedSessionLastActivityAtMock).toHaveBeenCalled();
    expect(ensureAccessTokenFreshMock).toHaveBeenCalled();
  });

  it("does not pulse when disabled", () => {
    renderHook(() => useOidcSessionKeepalive(false));

    expect(writeSharedSessionLastActivityAtMock).not.toHaveBeenCalled();
    expect(ensureAccessTokenFreshMock).not.toHaveBeenCalled();
  });

  it("pulseOidcSessionKeepalive refreshes once", async () => {
    await pulseOidcSessionKeepalive();

    expect(writeSharedSessionLastActivityAtMock).toHaveBeenCalled();
    expect(ensureAccessTokenFreshMock).toHaveBeenCalled();
  });
});
