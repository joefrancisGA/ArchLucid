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

  it("coerces string expires_in through resolveExpiresInSeconds when syncing BFF cookie", async () => {
    await syncBffSessionCookieFromTokenResponse({
      access_token: "access-1",
      expires_in: "7200" as unknown as number,
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/bff-session",
      expect.objectContaining({
        body: JSON.stringify({
          access_token: "access-1",
          expires_in: 7200,
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

  it("returns null when the BFF logout-url payload is not a string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ url: 123 }),
      })),
    );

    const url = await resolveRpLogoutUrlFromBffSession();

    expect(url).toBeNull();
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

  it("returns a B2C logout URL when the BFF response retains the policy query parameter", async () => {
    const b2cLogout =
      "https://contoso.b2clogin.com/contoso.onmicrosoft.com/B2C_1_signin/oauth2/v2.0/logout?p=B2C_1_signin&id_token_hint=eyJhbGciOiJub25lIn0.&post_logout_redirect_uri=https%3A%2F%2Fapp.example%2F";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ url: b2cLogout }),
      })),
    );

    const url = await resolveRpLogoutUrlFromBffSession();

    expect(url).toBe(b2cLogout);
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

  it("does not clear the session when the refresh route returns 503", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 503,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 501", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 501,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 502", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 502,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 408", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 408,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 504", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 504,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 425", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 425,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 429,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 410", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 410,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 411", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 411,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 412", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 412,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 413", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 413,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 414", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 414,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 415", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 415,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 416", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 416,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 417", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 417,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 418", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 418,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 419", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 419,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 420", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 420,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 421", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 421,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 422", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 422,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 423", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 423,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 424", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 424,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 426", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 426,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 427", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 427,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 428", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 428,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 430", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 430,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 431", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 431,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 432", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 432,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 433", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 433,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 434", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 434,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 435", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 435,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 436", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 436,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 437", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 437,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 438", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 438,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 439", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 439,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 440", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 440,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 441", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 441,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 442", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 442,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 443", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 443,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 444", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 444,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 445", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 445,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 446", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 446,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 447", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 447,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 448", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 448,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 449", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 449,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 450", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 450,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 451", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 451,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 452", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 452,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 453", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 453,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 454", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 454,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 455", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 455,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 456", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 456,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 457", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 457,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 458", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 458,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 459", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 459,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 460", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 460,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 461", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 461,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 462", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 462,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 463", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 463,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 464", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 464,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 465", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 465,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 466", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 466,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 467", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 467,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 468", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 468,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 469", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 469,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 470", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 470,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 471", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 471,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 472", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 472,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 473", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 473,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 474", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 474,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 475", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 475,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 476", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 476,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 477", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 477,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 478", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 478,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 479", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 479,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 480", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 480,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 481", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 481,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 482", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 482,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 483", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 483,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 484", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 484,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 485", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 485,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 486", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 486,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 487", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 487,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 488", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 488,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 489", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 489,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 490", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 490,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 491", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 491,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 492", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 492,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 493", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 493,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 494", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 494,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 495", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 495,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 496", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 496,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 497", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 497,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 498", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 498,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 499", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 499,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 501", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 501,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 502 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 502,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 503 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 503,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 504 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 504,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 505 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 505,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 506 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 506,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 507 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 507,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 508 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 508,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 509 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 509,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 510 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 510,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 511 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 511,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 512 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 512,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 513 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 513,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh without clearing session when the refresh route returns 514 in opaque BFF refresh parity sequence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 514,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("sets shouldClearSession when the refresh route returns 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: true });
  });

  it("sets shouldClearSession when the refresh route returns 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 403,
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: true });
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

  it("accepts refresh responses whose expires_at_ms is a fractional epoch number", async () => {
    const futureMs = Date.now() + 3_600_000 + 0.5;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: futureMs }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: true, expiresAtMs: Math.trunc(futureMs) });
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

  it("soft-fails refresh when expires_at_ms string has interior zero-width digit separators", async () => {
    const futureMs = Date.now() + 3_600_000;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: `${futureMs}\u200b000` }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is the literal Infinity string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: "Infinity" }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is the literal NaN string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: "NaN" }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is negative", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: -1 }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is a small hex-encoded string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: "0x1234" }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms string has grouped thousands separators", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: "1,700,000,000,000" }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms string has interior ASCII spaces", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: "1 730000000000" }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is a JSON array", async () => {
    const futureMs = Date.now() + 3_600_000;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: [futureMs] }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms string exceeds MAX_SAFE_INTEGER", async () => {
    const unsafeEpochMs = String(Number.MAX_SAFE_INTEGER + 1);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: unsafeEpochMs }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is an unsafe-integer JSON number", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: Number.MAX_SAFE_INTEGER + 1 }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is a JSON boolean", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: true }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is JSON null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: null }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when the response body omits expires_at_ms", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({}),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is a hex-encoded future epoch string", async () => {
    const futureMs = Date.now() + 3_600_000;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: `0x${futureMs.toString(16)}` }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is an empty string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: "" }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is a whitespace-only string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: "   " }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
  });

  it("soft-fails refresh when expires_at_ms is the literal null string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ expires_at_ms: "null" }),
      })),
    );

    const result = await refreshBffSessionCookie();

    expect(result).toEqual({ ok: false, shouldClearSession: false });
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
