import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchPostAuthBootstrapStatus,
  initiatePostAuthAccessRequest,
} from "@/lib/auth/post-auth-bootstrap-api";

describe("fetchPostAuthBootstrapStatus", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws bootstrap_status_failed when the proxy returns 401", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(fetchPostAuthBootstrapStatus()).rejects.toThrow("bootstrap_status_failed");
  });
});

describe("initiatePostAuthAccessRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true only for HTTP 202 Accepted", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 202 }));

    await expect(initiatePostAuthAccessRequest("hello")).resolves.toBe(true);
  });

  it("returns false when the API responds with 200 OK", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    await expect(initiatePostAuthAccessRequest()).resolves.toBe(false);
  });
});
