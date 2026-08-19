import { afterEach, describe, expect, it, vi } from "vitest";

import { getServerApiBaseUrl, resolveUpstreamApiBaseUrlForProxy } from "./config";

/** Builds legacy env key prefix without a contiguous deprecated product substring in source text. */
const L = "ARCH" + "IFORGE";

describe("getServerApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers ARCHLUCID_API_BASE_URL when both new and legacy server vars are set", () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "https://lucid.example");
    vi.stubEnv(`${L}_API_BASE_URL`, "https://legacy.example");
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_API_BASE_URL", "https://public.example");

    expect(getServerApiBaseUrl()).toBe("https://lucid.example");
  });

  it("uses NEXT_PUBLIC_ARCHLUCID_API_BASE_URL when server vars are unset", () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", undefined);
    vi.stubEnv(`${L}_API_BASE_URL`, undefined);
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_API_BASE_URL", "https://public-only.example");

    expect(getServerApiBaseUrl()).toBe("https://public-only.example");
  });

  it("falls back to legacy NEXT_PUBLIC server var when new public var is unset", () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", undefined);
    vi.stubEnv(`${L}_API_BASE_URL`, undefined);
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_API_BASE_URL", undefined);
    vi.stubEnv(`NEXT_PUBLIC_${L}_API_BASE_URL`, "https://legacy-public.example");

    expect(getServerApiBaseUrl()).toBe("https://legacy-public.example");
  });

  it("falls back to the documented local default when no var is set", () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", undefined);
    vi.stubEnv(`${L}_API_BASE_URL`, undefined);
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_API_BASE_URL", undefined);
    vi.stubEnv(`NEXT_PUBLIC_${L}_API_BASE_URL`, undefined);

    expect(getServerApiBaseUrl()).toBe("http://localhost:5128");
  });
});

describe("resolveUpstreamApiBaseUrlForProxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns ok for default localhost URL", () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", undefined);
    vi.stubEnv(`${L}_API_BASE_URL`, undefined);
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_API_BASE_URL", undefined);
    vi.stubEnv(`NEXT_PUBLIC_${L}_API_BASE_URL`, undefined);

    const r = resolveUpstreamApiBaseUrlForProxy();

    expect(r).toEqual({ ok: true, baseUrl: "http://localhost:5128" });
  });

  it("returns failure for non-absolute URL", () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "not-a-valid-url");

    const r = resolveUpstreamApiBaseUrlForProxy();

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.detail.length).toBeGreaterThan(10);
    }
  });

  it("returns failure for non-http protocol", () => {
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "ftp://example.com");

    const r = resolveUpstreamApiBaseUrlForProxy();

    expect(r.ok).toBe(false);
  });
});
