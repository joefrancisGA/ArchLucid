import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

describe("POST /api/run-demo-review", () => {
  const fetchMock = vi.fn();
  const upstreamApiBaseUrl = "http://localhost:5128";

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.ARCHLUCID_API_BASE_URL = upstreamApiBaseUrl;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.ARCHLUCID_API_BASE_URL;
  });

  it("returns 200 with redirectTo from upstream runDetailUrl", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          runId: "abc123",
          runDetailUrl: "/architecture/reviews/abc123",
          policyPackName: "Security Architecture Baseline",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const req = new NextRequest("http://localhost/api/run-demo-review", { method: "POST" });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const json: unknown = await res.json();
    expect(json).toMatchObject({
      redirectTo: "/architecture/reviews/abc123",
      policyPackName: "Security Architecture Baseline",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0]!;
    expect(String(calledUrl)).toBe(`${upstreamApiBaseUrl}/v1/reviews/demo`);
  });

  it("passes upstream non-200 status through", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ title: "Forbidden", status: 403 }), {
        status: 403,
        headers: { "Content-Type": "application/problem+json" },
      }),
    );

    const req = new NextRequest("http://localhost/api/run-demo-review", { method: "POST" });

    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it("returns 502 when the proxy fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    const req = new NextRequest("http://localhost/api/run-demo-review", { method: "POST" });

    const res = await POST(req);

    expect(res.status).toBe(502);
    const json: unknown = await res.json();
    expect(json).toMatchObject({ title: "Demo review unavailable", status: 502 });
  });
});
