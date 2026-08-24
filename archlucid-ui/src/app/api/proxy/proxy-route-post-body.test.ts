import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./[...path]/route";
import { PROXY_MAX_BODY_BYTES, PROXY_MAX_MULTIPART_BODY_BYTES } from "@/lib/proxy-constants";

describe("POST /api/proxy/[...path] body limits", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns 413 when Content-Length declares a body larger than the JSON cap", async () => {
    const req = new NextRequest("http://localhost/api/proxy/health/live", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(PROXY_MAX_BODY_BYTES + 1),
      },
      body: "{}",
    });

    const res = await POST(req, { params: Promise.resolve({ path: ["api", "health"] }) });

    expect(res.status).toBe(413);
    const json: unknown = await res.json();
    expect(json).toMatchObject({ title: "Payload too large", status: 413 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 413 when streamed JSON body exceeds the JSON cap", async () => {
    const oversized = new Uint8Array(PROXY_MAX_BODY_BYTES + 1);
    const req = new NextRequest("http://localhost/api/proxy/health/live", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: oversized,
    });

    const res = await POST(req, { params: Promise.resolve({ path: ["api", "health"] }) });

    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards small POST to upstream when within limit", async () => {
    const req = new NextRequest("http://localhost/api/proxy/health/live", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "2" },
      body: "{}",
    });

    const res = await POST(req, { params: Promise.resolve({ path: ["api", "health"] }) });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("allows multipart evidence uploads larger than the JSON cap and under 100 MB", async () => {
    const payload = new Uint8Array(PROXY_MAX_BODY_BYTES + 2_048);
    const req = new NextRequest("http://localhost/api/proxy/v1/architecture/review/r1/evidence/bulk", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=----x",
        "content-length": String(payload.byteLength),
      },
      body: payload,
    });

    const res = await POST(req, {
      params: Promise.resolve({ path: ["v1", "architecture", "run", "r1", "evidence", "bulk"] }),
    });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1] as { body?: Uint8Array } | undefined;
    expect(init?.body).toBeInstanceOf(Uint8Array);
    expect((init?.body as Uint8Array).byteLength).toBe(payload.byteLength);
  });

  it("returns 413 when multipart evidence upload exceeds the 100 MB cap", async () => {
    const req = new NextRequest("http://localhost/api/proxy/v1/architecture/review/r1/evidence/bulk", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=----x",
        "content-length": String(PROXY_MAX_MULTIPART_BODY_BYTES + 1),
      },
      body: "x",
    });

    const res = await POST(req, {
      params: Promise.resolve({ path: ["v1", "architecture", "run", "r1", "evidence", "bulk"] }),
    });

    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("names method, path, and budget when upstream AbortSignal times out", async () => {
    fetchMock.mockRejectedValueOnce(new Error("The operation was aborted due to timeout"));

    const req = new NextRequest("http://localhost/api/proxy/v1/architecture/request", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "2" },
      body: "{}",
    });

    const res = await POST(req, {
      params: Promise.resolve({ path: ["v1", "architecture", "request"] }),
    });

    expect(res.status).toBe(502);
    const json = (await res.json()) as {
      title?: string;
      detail?: string;
      instance?: string;
      upstreamPath?: string;
      upstreamTimeoutMs?: number;
    };
    expect(json.title).toBe("Upstream API unreachable");
    expect(json.detail).toContain("POST /v1/architecture/request timed out after 60s");
    expect(json.detail).toContain("budget 60000ms");
    expect(json.instance).toBe("POST /v1/architecture/request");
    expect(json.upstreamPath).toBe("v1/architecture/request");
    expect(json.upstreamTimeoutMs).toBe(60_000);
  });

  it("uses the 10-minute budget when the catalog reset upstream times out", async () => {
    fetchMock.mockRejectedValueOnce(new Error("The operation was aborted due to timeout"));

    const req = new NextRequest("http://localhost/api/proxy/v1/diagnostics/reset-development-catalog", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "2" },
      body: "{}",
    });

    const res = await POST(req, {
      params: Promise.resolve({ path: ["v1", "diagnostics", "reset-development-catalog"] }),
    });

    expect(res.status).toBe(502);
    const json = (await res.json()) as {
      title?: string;
      detail?: string;
      upstreamTimeoutMs?: number;
    };
    expect(json.title).toBe("Upstream API unreachable");
    expect(json.detail).toContain("timed out after 600s");
    expect(json.detail).toContain("budget 600000ms");
    expect(json.upstreamTimeoutMs).toBe(600_000);
  });
});
