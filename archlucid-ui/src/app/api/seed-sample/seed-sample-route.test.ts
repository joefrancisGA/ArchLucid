import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";
import { CORRELATION_ID_HEADER } from "@/lib/correlation";

/**
 * Covers the OS-1 internal seed-sample route handler. The handler bridges the Reviews empty-state button to the
 * upstream `/api/proxy/v1/demo/seed` proxy: on 204 it returns `{ redirectTo: "/reviews" }`, otherwise it passes
 * the upstream status and body through so callers can surface a Problem Details toast.
 */
describe("POST /api/seed-sample", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns 200 with redirectTo on upstream 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const req = new NextRequest("http://localhost/api/seed-sample", { method: "POST" });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const json: unknown = await res.json();
    expect(json).toEqual({ redirectTo: "/reviews" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0]!;
    expect(String(calledUrl)).toBe("http://localhost/api/proxy/v1/demo/seed");
  });

  it("passes upstream non-204 status and body through to the caller", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ title: "Bad Request", status: 400 }), {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      }),
    );

    const req = new NextRequest("http://localhost/api/seed-sample", { method: "POST" });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const json: unknown = await res.json();
    expect(json).toMatchObject({ title: "Bad Request", status: 400 });
  });

  it("returns 502 with Problem Details when the proxy fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    const req = new NextRequest("http://localhost/api/seed-sample", { method: "POST" });

    const res = await POST(req);

    expect(res.status).toBe(502);
    const json: unknown = await res.json();
    expect(json).toMatchObject({ title: "Sample seed unavailable", status: 502 });
  });

  it("forwards a safe browser correlation id and echoes one on the response", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const browserId = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    const req = new NextRequest("http://localhost/api/seed-sample", {
      method: "POST",
      headers: { [CORRELATION_ID_HEADER]: browserId },
    });

    const res = await POST(req);

    expect(res.headers.get(CORRELATION_ID_HEADER)).toBe(browserId);

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get(CORRELATION_ID_HEADER)).toBe(browserId);
  });
});
