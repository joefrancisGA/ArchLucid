import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearBffSessionCookie,
  refreshBffSessionCookie,
  syncBffSessionCookieFromTokenResponse,
} from "@/lib/oidc/bff-session-sync";

describe("bff-session-sync (LK-05 P1)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts token material to the BFF session route after sign-in", async () => {
    await syncBffSessionCookieFromTokenResponse({
      access_token: "access-1",
      expires_in: 3600,
      refresh_token: "refresh-1",
      id_token: "id-1",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/bff-session",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({
          access_token: "access-1",
          expires_in: 3600,
          refresh_token: "refresh-1",
          id_token: "id-1",
          working_mode: true,
        }),
      }),
    );
  });

  it("clears the BFF session cookie on sign-out", async () => {
    await clearBffSessionCookie();

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/bff-session",
      expect.objectContaining({
        method: "DELETE",
        credentials: "same-origin",
      }),
    );
  });

  it("honors zero expires_in when syncing BFF cookie (parity with session.resolveExpiresInSeconds)", async () => {
    await syncBffSessionCookieFromTokenResponse({
      access_token: "access-1",
      expires_in: 0,
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/bff-session",
      expect.objectContaining({
        body: JSON.stringify({
          access_token: "access-1",
          expires_in: 0,
          working_mode: true,
        }),
      }),
    );
  });

  it("truncates fractional expires_in when syncing BFF cookie", async () => {
    await syncBffSessionCookieFromTokenResponse({
      access_token: "access-1",
      expires_in: 3600.9,
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/bff-session",
      expect.objectContaining({
        body: JSON.stringify({
          access_token: "access-1",
          expires_in: 3600,
          working_mode: true,
        }),
      }),
    );
  });

  it("maps negative expires_in to the default lifetime (parity with session.resolveExpiresInSeconds)", async () => {
    await syncBffSessionCookieFromTokenResponse({
      access_token: "access-1",
      expires_in: -30,
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/bff-session",
      expect.objectContaining({
        body: JSON.stringify({
          access_token: "access-1",
          expires_in: 3600,
          working_mode: true,
        }),
      }),
    );
  });
});

describe("refreshBffSessionCookie (LK-06 P2)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects refresh responses whose expires_at_ms is far in the past", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: 1 }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("accepts refresh responses whose expires_at_ms is in the future", async () => {
    const futureMs = Date.now() + 3_600_000;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: futureMs }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: true, expiresAtMs: futureMs });
  });
});
