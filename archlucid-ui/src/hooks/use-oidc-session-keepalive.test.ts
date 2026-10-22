import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import * as sessionIdle from "@/lib/auth/session-idle-timeout";
import * as bffSessionSync from "@/lib/oidc/bff-session-sync";
import * as oidcSession from "@/lib/oidc/session";
import { pulseOidcSessionKeepalive, useOidcSessionKeepalive } from "@/hooks/use-oidc-session-keepalive";

describe("useOidcSessionKeepalive", () => {
  beforeEach(() => {
    vi.spyOn(sessionIdle, "writeSharedSessionLastActivityAt").mockImplementation(() => undefined);
    vi.spyOn(oidcSession, "ensureAccessTokenFresh").mockResolvedValue(undefined);
    vi.spyOn(bffSessionSync, "pulseBffSessionActivity").mockResolvedValue("ok");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("pulses activity and token refresh when enabled", () => {
    renderHook(() => useOidcSessionKeepalive(true));

    expect(sessionIdle.writeSharedSessionLastActivityAt).toHaveBeenCalled();
    expect(oidcSession.ensureAccessTokenFresh).toHaveBeenCalled();
    expect(bffSessionSync.pulseBffSessionActivity).toHaveBeenCalled();
  });

  it("does not pulse when disabled", () => {
    renderHook(() => useOidcSessionKeepalive(false));

    expect(sessionIdle.writeSharedSessionLastActivityAt).not.toHaveBeenCalled();
    expect(oidcSession.ensureAccessTokenFresh).not.toHaveBeenCalled();
    expect(bffSessionSync.pulseBffSessionActivity).not.toHaveBeenCalled();
  });

  it("pulseOidcSessionKeepalive refreshes once", async () => {
    await pulseOidcSessionKeepalive();

    expect(sessionIdle.writeSharedSessionLastActivityAt).toHaveBeenCalled();
    expect(oidcSession.ensureAccessTokenFresh).toHaveBeenCalled();
    expect(bffSessionSync.pulseBffSessionActivity).toHaveBeenCalled();
  });

  it("clears the OIDC session when the BFF activity pulse is unauthorized", async () => {
    vi.mocked(bffSessionSync.pulseBffSessionActivity).mockResolvedValueOnce("unauthorized");
    const clearSpy = vi.spyOn(oidcSession, "clearOidcSession").mockImplementation(() => undefined);

    await pulseOidcSessionKeepalive();

    expect(clearSpy).toHaveBeenCalled();
  });
});
