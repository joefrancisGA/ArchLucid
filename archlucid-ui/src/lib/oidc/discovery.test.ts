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

  it("strips zero-width characters from the configured authority before fetching discovery", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => discoveryDoc,
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    await loadDiscoveryDocument(`\u200blogin.microsoftonline.com/tenant/v2.0\u200b`);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://login.microsoftonline.com/tenant/v2.0/.well-known/openid-configuration",
      { cache: "no-store" },
    );
  });

  it("reuses discovery cache when authority differs only by a trailing slash", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => discoveryDoc,
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    await loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0/");
    await loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0");

    expect(fetchMock).toHaveBeenCalledTimes(1);
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

  it("retries discovery after a transient fetch failure instead of caching the rejection", async () => {
    let attempt = 0;
    const fetchMock = vi.fn(async () => {
      attempt += 1;

      if (attempt === 1) {
        return {
          ok: false,
          status: 503,
          json: async () => ({}),
        };
      }

      return {
        ok: true,
        json: async () => discoveryDoc,
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");
    const authority = "https://login.microsoftonline.com/tenant/v2.0";

    await expect(loadDiscoveryDocument(authority)).rejects.toThrow("OIDC discovery failed");

    const doc = await loadDiscoveryDocument(authority);

    expect(doc).toEqual(discoveryDoc);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries discovery after a malformed document missing endpoints instead of caching it permanently", async () => {
    let attempt = 0;
    const fetchMock = vi.fn(async () => {
      attempt += 1;

      if (attempt === 1) {
        return {
          ok: true,
          json: async () => ({ issuer: "https://login.microsoftonline.com/tenant/v2.0" }),
        };
      }

      return {
        ok: true,
        json: async () => discoveryDoc,
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");
    const authority = "https://login.microsoftonline.com/tenant/v2.0";

    await expect(loadDiscoveryDocument(authority)).rejects.toThrow(/missing required endpoints/i);

    const doc = await loadDiscoveryDocument(authority);

    expect(doc).toEqual(discoveryDoc);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("omits malformed end_session_endpoint instead of advertising RP-initiated logout", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...discoveryDoc,
        end_session_endpoint: "not-a-valid-url",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    const doc = await loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0");

    expect(doc.end_session_endpoint).toBeUndefined();
  });

  it("omits end_session_endpoint that does not use http or https", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...discoveryDoc,
        end_session_endpoint: "javascript:alert(1)",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    const doc = await loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0");

    expect(doc.end_session_endpoint).toBeUndefined();
  });

  it("omits end_session_endpoint that embeds userinfo credentials", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...discoveryDoc,
        end_session_endpoint: "https://user:pass@login.microsoftonline.com/logout",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    const doc = await loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0");

    expect(doc.end_session_endpoint).toBeUndefined();
  });

  it("omits zero-width-only end_session_endpoint values", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...discoveryDoc,
        end_session_endpoint: "\u200b\u200b",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    const doc = await loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0");

    expect(doc.end_session_endpoint).toBeUndefined();
  });

  it("keeps a valid end_session_endpoint", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...discoveryDoc,
        end_session_endpoint: "https://login.microsoftonline.com/logout",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    const doc = await loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0");

    expect(doc.end_session_endpoint).toBe("https://login.microsoftonline.com/logout");
  });

  it("strips zero-width characters from discovery endpoint URLs", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        issuer: "https://login.microsoftonline.com/tenant/v2.0",
        authorization_endpoint: `https://login.microsoftonline.com/authorize\u200b`,
        token_endpoint: `https://login.microsoftonline.com/token\u200b`,
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    const doc = await loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0");

    expect(doc.authorization_endpoint).toBe("https://login.microsoftonline.com/authorize");
    expect(doc.token_endpoint).toBe("https://login.microsoftonline.com/token");
  });

  it("ignores hash fragments when building the discovery URL", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => discoveryDoc,
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    await loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0#stale-fragment");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://login.microsoftonline.com/tenant/v2.0/.well-known/openid-configuration",
      { cache: "no-store" },
    );
  });

  it("rejects token endpoints that embed userinfo credentials", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        issuer: "https://login.microsoftonline.com/tenant/v2.0",
        authorization_endpoint: "https://login.microsoftonline.com/authorize",
        token_endpoint: "https://user:pass@login.microsoftonline.com/token",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    await expect(loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0")).rejects.toThrow(
      /invalid endpoint URLs/i,
    );
  });

  it("rejects authorization endpoints that embed userinfo credentials", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        issuer: "https://login.microsoftonline.com/tenant/v2.0",
        authorization_endpoint: "https://user:pass@login.microsoftonline.com/authorize",
        token_endpoint: "https://login.microsoftonline.com/token",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    await expect(loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0")).rejects.toThrow(
      /invalid endpoint URLs/i,
    );
  });

  it("accepts B2C-style authorization and token endpoints that include required query parameters", async () => {
    const b2cAuthorize =
      "https://contoso.b2clogin.com/contoso.onmicrosoft.com/B2C_1_signin/oauth2/v2.0/authorize?p=B2C_1_signin";
    const b2cToken =
      "https://contoso.b2clogin.com/contoso.onmicrosoft.com/B2C_1_signin/oauth2/v2.0/token?p=B2C_1_signin";

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        issuer: "https://contoso.b2clogin.com/00000000-0000-0000-0000-000000000000/v2.0/",
        authorization_endpoint: b2cAuthorize,
        token_endpoint: b2cToken,
        end_session_endpoint: "https://contoso.b2clogin.com/contoso.onmicrosoft.com/B2C_1_signin/oauth2/v2.0/logout?p=B2C_1_signin",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    const doc = await loadDiscoveryDocument("https://contoso.b2clogin.com/contoso.onmicrosoft.com/B2C_1_signin/v2.0");

    expect(doc.authorization_endpoint).toBe(b2cAuthorize);
    expect(doc.token_endpoint).toBe(b2cToken);
    expect(doc.end_session_endpoint).toContain("p=B2C_1_signin");
  });

  it("rejects authorization endpoints that include a hash fragment", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        issuer: "https://login.microsoftonline.com/tenant/v2.0",
        authorization_endpoint: "https://login.microsoftonline.com/authorize#stale-fragment",
        token_endpoint: "https://login.microsoftonline.com/token",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    await expect(loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0")).rejects.toThrow(
      /invalid endpoint URLs/i,
    );
  });

  it("rejects token endpoints that include a hash fragment", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        issuer: "https://login.microsoftonline.com/tenant/v2.0",
        authorization_endpoint: "https://login.microsoftonline.com/authorize",
        token_endpoint: "https://login.microsoftonline.com/token#stale-fragment",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    await expect(loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0")).rejects.toThrow(
      /invalid endpoint URLs/i,
    );
  });

  it("omits end_session_endpoint values that include a hash fragment", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        issuer: "https://login.microsoftonline.com/tenant/v2.0",
        authorization_endpoint: "https://login.microsoftonline.com/authorize",
        token_endpoint: "https://login.microsoftonline.com/token",
        end_session_endpoint: "https://login.microsoftonline.com/logout#stale-fragment",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    const doc = await loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0");

    expect(doc.end_session_endpoint).toBeUndefined();
  });

  it("rejects discovery endpoints that do not use http or https", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        issuer: "https://login.microsoftonline.com/tenant/v2.0",
        authorization_endpoint: "javascript:alert(1)",
        token_endpoint: "https://login.microsoftonline.com/token",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    const { loadDiscoveryDocument } = await import("@/lib/oidc/discovery");

    await expect(loadDiscoveryDocument("https://login.microsoftonline.com/tenant/v2.0")).rejects.toThrow(
      /invalid endpoint URLs/i,
    );
  });
});
