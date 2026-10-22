import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import { POST } from "./route";
import { CORRELATION_ID_HEADER } from "@/lib/correlation";

describe("POST /api/purge-sample", () => {
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

    const req = new NextRequest("http://localhost/api/purge-sample", { method: "POST" });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const json: unknown = await res.json();
    expect(json).toEqual({ redirectTo: SPONSOR_DASHBOARD_HREF });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0]!;
    expect(String(calledUrl)).toBe("http://localhost/api/proxy/v1/demo/purge-sample");
  });

  it("passes upstream non-204 status and body through to the caller", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ title: "Bad Request", status: 400 }), {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      }),
    );

    const req = new NextRequest("http://localhost/api/purge-sample", { method: "POST" });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const json: unknown = await res.json();
    expect(json).toMatchObject({ title: "Bad Request", status: 400 });
  });
});
