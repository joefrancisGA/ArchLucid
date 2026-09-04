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
});
