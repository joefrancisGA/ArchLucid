import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_SIGNIN_PATH } from "@/lib/auth-operator-route-paths";

vi.mock("@/lib/legacy-arch-env", () => ({
  readServerApiBaseUrlFromEnv: () => "https://api.test",
}));

import { fetchExecDigestSponsorDeepLinkView } from "./exec-digest-sponsor-deep-link-server";

describe("fetchExecDigestSponsorDeepLinkView", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults signInUrl to the canonical auth sign-in route when API omits it", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          target: "dashboard",
          weekLabel: "Week of Aug 10, 2026",
          topRuns: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const view = await fetchExecDigestSponsorDeepLinkView("sponsor-token");

    expect(view?.signInUrl).toBe(AUTH_SIGNIN_PATH);
    expect(view?.signInUrl).not.toBe("/auth/sign-in");
  });
});
