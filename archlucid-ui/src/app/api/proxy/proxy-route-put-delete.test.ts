import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PUT } from "./[...path]/route";
import { CORRELATION_ID_HEADER } from "@/lib/correlation";
import { resetProxyRateLimitStateForTests } from "@/lib/proxy-rate-limit";

describe("proxy route PUT/DELETE forwarding", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetProxyRateLimitStateForTests();
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 204,
        headers: { [CORRELATION_ID_HEADER]: "upstream-put-del" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("forwards PUT body and browser correlation id", async () => {
    const browserId = "cccccccc-cccc-4ccc-cccc-cccccccccccc";
    const req = new NextRequest("http://localhost/api/proxy/v1/sample", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "content-length": "11",
        [CORRELATION_ID_HEADER]: browserId,
      },
      body: '{"ok":true}',
    });

    const res = await PUT(req, { params: Promise.resolve({ path: ["v1", "sample"] }) });

    expect(res.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).method).toBe("PUT");
    expect(((init as RequestInit).headers as Headers).get(CORRELATION_ID_HEADER)).toBe(browserId);
  });

  it("forwards DELETE without body", async () => {
    const browserId = "dddddddd-dddd-4ddd-dddd-dddddddddddd";
    const req = new NextRequest("http://localhost/api/proxy/v1/sample", {
      method: "DELETE",
      headers: { [CORRELATION_ID_HEADER]: browserId },
    });

    const res = await DELETE(req, { params: Promise.resolve({ path: ["v1", "sample"] }) });

    expect(res.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).method).toBe("DELETE");
    expect((init as RequestInit).body).toBeUndefined();
    expect(((init as RequestInit).headers as Headers).get(CORRELATION_ID_HEADER)).toBe(browserId);
  });
});
