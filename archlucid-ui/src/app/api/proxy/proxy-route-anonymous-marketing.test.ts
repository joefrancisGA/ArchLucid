import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PATCH, POST } from "./[...path]/route";
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

  it("forwards pricing quote-request 204 with a null body (no NextResponse throw)", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const req = new NextRequest("http://localhost/api/proxy/v1/marketing/pricing/quote-request", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "12" },
      body: '{"ok":true}',
    });

    const res = await POST(req, {
      params: Promise.resolve({ path: ["v1", "marketing", "pricing", "quote-request"] }),
    });

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get("authorization")).toBeNull();
  });

  it("rejects PATCH with percent-encoded dot traversal to operator draft", async () => {
    const req = new NextRequest(
      "http://localhost/api/proxy/v1/marketing/quick-scan/%2e%2e/%2e%2e/%2e%2e/architecture/draft/draft-1",
      {
        method: "PATCH",
        headers: { "content-type": "application/json", "content-length": "2" },
        body: "{}",
      },
    );

    const res = await PATCH(req, {
      params: Promise.resolve({
        path: ["v1", "marketing", "quick-scan", "%2e%2e", "%2e%2e", "%2e%2e", "architecture", "draft", "draft-1"],
      }),
    });

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects PATCH that traverses from marketing quick-scan to operator draft", async () => {
    const req = new NextRequest(
      "http://localhost/api/proxy/v1/marketing/quick-scan/status/../../../architecture/draft/draft-1",
      {
        method: "PATCH",
        headers: { "content-type": "application/json", "content-length": "2" },
        body: "{}",
      },
    );

    const res = await PATCH(req, {
      params: Promise.resolve({
        path: ["v1", "marketing", "quick-scan", "status", "..", "..", "..", "architecture", "draft", "draft-1"],
      }),
    });

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
