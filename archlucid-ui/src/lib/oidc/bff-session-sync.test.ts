import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearBffSessionCookie, syncBffSessionCookieFromTokenResponse } from "@/lib/oidc/bff-session-sync";

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
});
