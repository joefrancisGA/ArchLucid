import type { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { isSameOriginBffRequest } from "@/lib/proxy/bff-session-request";

const ORIGIN = "http://127.0.0.1:3000";

function mockRequest(options?: {
  readonly origin?: string | null;
  readonly secFetchSite?: string | null;
  readonly referer?: string | null;
}): NextRequest {
  const headers = new Headers();

  if (options?.origin) {
    headers.set("origin", options.origin);
  }

  if (options?.secFetchSite) {
    headers.set("sec-fetch-site", options.secFetchSite);
  }

  if (options?.referer) {
    headers.set("referer", options.referer);
  }

  return {
    headers,
    nextUrl: new URL(`${ORIGIN}/api/auth/bff-session`),
  } as NextRequest;
}

describe("isSameOriginBffRequest", () => {
  it("allows a matching Origin header", () => {
    expect(isSameOriginBffRequest(mockRequest({ origin: ORIGIN }))).toBe(true);
  });

  it("rejects a cross-site Origin header", () => {
    expect(isSameOriginBffRequest(mockRequest({ origin: "https://evil.example" }))).toBe(false);
  });

  it("allows an explicitly configured loopback origin", () => {
    vi.stubEnv("ARCHLUCID_BFF_ALLOWED_ORIGINS", "http://localhost:3000");

    expect(isSameOriginBffRequest(mockRequest({ origin: "http://localhost:3000" }))).toBe(true);

    vi.unstubAllEnvs();
  });

  it("rejects malformed configured origins", () => {
    vi.stubEnv("ARCHLUCID_BFF_ALLOWED_ORIGINS", "localhost:3000,https://evil.example/path");

    expect(isSameOriginBffRequest(mockRequest({ origin: "http://localhost:3000" }))).toBe(false);

    vi.unstubAllEnvs();
  });

  it("allows same-origin Sec-Fetch-Site when Origin is omitted", () => {
    expect(isSameOriginBffRequest(mockRequest({ secFetchSite: "same-origin" }))).toBe(true);
  });

  it("allows same-site Sec-Fetch-Site when Origin is omitted", () => {
    expect(isSameOriginBffRequest(mockRequest({ secFetchSite: "same-site" }))).toBe(true);
  });

  it("allows a same-origin Referer when Origin and Sec-Fetch-Site are omitted", () => {
    expect(
      isSameOriginBffRequest(mockRequest({ referer: `${ORIGIN}/auth/signin` })),
    ).toBe(true);
  });

  it("rejects a request with no Origin, Sec-Fetch-Site, or Referer", () => {
    expect(isSameOriginBffRequest(mockRequest())).toBe(false);
  });
});
