import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearBffSessionCookie,
  pulseBffSessionActivity,
  refreshBffSessionCookie,
  resolveRpLogoutUrlFromBffSession,
  syncBffSessionCookieFromTokenResponse,
} from "@/lib/oidc/bff-session-sync";

describe("bff-session-sync (LK-05 P1)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("strips zero-width characters from token fields before posting to the BFF", async () => {
    await syncBffSessionCookieFromTokenResponse({
      access_token: "access\u200b-1",
      expires_in: 3600,
      refresh_token: "refresh\u200b-1",
      id_token: "id\u200b-1",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/bff-session",
      expect.objectContaining({
        method: "POST",
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

  it("trims whitespace from refresh_token and id_token before posting to the BFF", async () => {
    await syncBffSessionCookieFromTokenResponse({
      access_token: "access-1",
      expires_in: 3600,
      refresh_token: "  refresh-1  ",
      id_token: "  id-1  ",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/bff-session",
      expect.objectContaining({
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

describe("pulseBffSessionActivity (LK-07)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = "archlucid-bff-csrf=; Max-Age=0";
  });

  it("reports unauthorized when the activity route rejects the BFF session", async () => {
    document.cookie = "archlucid-bff-csrf=csrf-token";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
      })),
    );
    const result = await pulseBffSessionActivity();

    expect(result).toBe("unauthorized");
  });
});

describe("resolveRpLogoutUrlFromBffSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when the BFF logout URL embeds userinfo credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ url: "https://user:pass@idp.example/logout" }),
      })),
    );

    const url = await resolveRpLogoutUrlFromBffSession();

    expect(url).toBeNull();
  });

  it("returns a trimmed logout URL when the BFF response is safe", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ url: "  https://idp.example/logout  " }),
      })),
    );

    const url = await resolveRpLogoutUrlFromBffSession();

    expect(url).toBe("https://idp.example/logout");
  });

  it("strips zero-width characters from BFF logout URLs before safety checks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ url: "https://idp.example/logout\u200b" }),
      })),
    );

    const url = await resolveRpLogoutUrlFromBffSession();

    expect(url).toBe("https://idp.example/logout");
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

  it("accepts refresh responses whose expires_at_ms string has zero-width padding", async () => {
    const futureMs = Date.now() + 3_600_000;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: `${futureMs}\u200b` }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: true, expiresAtMs: futureMs });
  });

  it("accepts refresh responses whose expires_at_ms string uses scientific notation", async () => {
    const futureMs = Date.now() + 3_600_000;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: `${futureMs.toExponential()}` }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.expiresAtMs).toBeGreaterThan(Date.now());
    }
  });
});
