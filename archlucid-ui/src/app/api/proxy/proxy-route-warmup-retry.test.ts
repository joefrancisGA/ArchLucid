import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./[...path]/route";
import { resetProxyRateLimitStateForTests } from "@/lib/proxy-rate-limit";

describe("proxy route warmup retry (TB-757)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetProxyRateLimitStateForTests();
    vi.useFakeTimers();
    vi.stubEnv("ARCHLUCID_API_BASE_URL", "http://localhost:5128");
    fetchMock.mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("retries brief upstream 502 on GET before returning success", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response('{"title":"Upstream API unreachable"}', {
          status: 502,
          headers: { "Content-Type": "application/problem+json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response("{}", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const req = new NextRequest(`http://localhost/api/proxy/health/live`);
    const pending = GET(req, { params: Promise.resolve({ path: ["api", "health", "live"] }) });
    await vi.runAllTimersAsync();
    const res = await pending;

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("normalizes empty successful JSON bodies to {}", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const req = new NextRequest(`http://localhost/api/proxy/v1/tenant/workspace-baseline-artifacts`);
    const res = await GET(req, {
      params: Promise.resolve({ path: ["v1", "tenant", "workspace-baseline-artifacts"] }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({});
  });

  it("does not retry POST upstream 502", async () => {
    const { POST } = await import("./[...path]/route");

    fetchMock.mockResolvedValueOnce(
      new Response('{"title":"Upstream API unreachable"}', {
        status: 502,
        headers: { "Content-Type": "application/problem+json" },
      }),
    );

    const req = new NextRequest(`http://localhost/api/proxy/v1/runs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": "2",
      },
      body: "{}",
    });

    const res = await POST(req, { params: Promise.resolve({ path: ["v1", "runs"] }) });

    expect(res.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
