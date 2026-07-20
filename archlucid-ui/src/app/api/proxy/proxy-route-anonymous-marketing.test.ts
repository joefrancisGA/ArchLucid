import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./[...path]/route";
import { resetProxyRateLimitStateForTests } from "@/lib/proxy-rate-limit";

describe("proxy route anonymous marketing paths", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetProxyRateLimitStateForTests();
    vi.stubEnv("ARCHLUCID_PROXY_BEARER_TOKEN", "configured-proxy-bearer");
    fetchMock.mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not attach server bearer for marketing quick-scan status", async () => {
    const req = new NextRequest("http://localhost/api/proxy/v1/marketing/quick-scan/status");

    await GET(req, { params: Promise.resolve({ path: ["v1", "marketing", "quick-scan", "status"] }) });

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get("authorization")).toBeNull();
  });

  it("still attaches server bearer for protected architecture quick-scan", async () => {
    const req = new NextRequest("http://localhost/api/proxy/v1/architecture/quick-scan/status");

    await GET(req, { params: Promise.resolve({ path: ["v1", "architecture", "quick-scan", "status"] }) });

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer configured-proxy-bearer");
  });
});
