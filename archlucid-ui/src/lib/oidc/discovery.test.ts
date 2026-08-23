import { afterEach, describe, expect, it, vi } from "vitest";

const discoveryDoc = {
  issuer: "https://login.microsoftonline.com/tenant/v2.0",
  authorization_endpoint: "https://login.microsoftonline.com/authorize",
  token_endpoint: "https://login.microsoftonline.com/token",
};

describe("loadDiscoveryDocument", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("prefixes https:// when authority omits a scheme", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => discoveryDoc,
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    await loadDiscoveryDocument("login.microsoftonline.com/tenant/v2.0");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://login.microsoftonline.com/tenant/v2.0/.well-known/openid-configuration",
      { cache: "no-store" },
    );
  });
});
