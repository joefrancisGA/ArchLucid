import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CORRELATION_ID_HEADER } from "@/lib/correlation";
import { POST } from "./route";

describe("POST /api/reset-database", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("passes upstream success status and body through to the caller", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ catalogName: "ArchLucid", demoSeedApplied: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          [CORRELATION_ID_HEADER]: "upstream-reset-id",
        },
      }),
    );

    const req = new NextRequest("http://localhost/api/reset-database", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ catalogName: "ArchLucid", demoSeedApplied: true });
    expect(res.headers.get(CORRELATION_ID_HEADER)).toBe("upstream-reset-id");

    const [calledUrl] = fetchMock.mock.calls[0]!;
    expect(String(calledUrl)).toBe("http://localhost/api/proxy/v1/diagnostics/reset-development-catalog");
  });

  it("returns 502 with Problem Details when the proxy fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    const req = new NextRequest("http://localhost/api/reset-database", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({
      title: "Database reset unavailable",
      status: 502,
      detail: expect.stringContaining("/api/proxy/v1/diagnostics/reset-development-catalog"),
    });
  });

  it("forwards a safe browser correlation id and prefers the upstream correlation id on the response", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ catalogName: "ArchLucid", demoSeedApplied: false }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          [CORRELATION_ID_HEADER]: "upstream-reset-id",
        },
      }),
    );

    const browserId = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    const req = new NextRequest("http://localhost/api/reset-database", {
      method: "POST",
      headers: { [CORRELATION_ID_HEADER]: browserId },
    });

    const res = await POST(req);

    expect(res.headers.get(CORRELATION_ID_HEADER)).toBe("upstream-reset-id");

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get(CORRELATION_ID_HEADER)).toBe(browserId);
  });
});
