import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isApiLoadFailureState, toApiLoadFailure } from "@/lib/api-load-failure";
import { ApiRequestError } from "@/lib/api-request-error";

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

import { proxyJsonGet, proxyJsonPut } from "@/lib/proxy-json-client";

describe("proxyJsonGet", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends GET with credentials and Accept header", async () => {
    const payload = await proxyJsonGet<{ ok: boolean }>("/api/proxy/v1/example");

    expect(payload).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      "/api/proxy/v1/example",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);

    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("x-correlation-id")).toEqual(expect.any(String));
  });

  it("throws ApiLoadFailureState on HTTP error with problem details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: "Forbidden", status: 403 }), {
          status: 403,
          statusText: "Forbidden",
        }),
      ),
    );

    await expect(proxyJsonGet("/api/proxy/v1/example")).rejects.toSatisfy((error: unknown) => {
      expect(isApiLoadFailureState(error)).toBe(true);

      if (!isApiLoadFailureState(error)) {
        return false;
      }

      expect(error.httpStatus).toBe(403);
      expect(error.message).toContain("Forbidden");

      return true;
    });
  });

  it("throws ApiLoadFailureState on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(proxyJsonGet("/api/proxy/v1/example")).rejects.toSatisfy((error: unknown) => {
      const failure = toApiLoadFailure(error);

      expect(failure.message).toBe("network down");

      return isApiLoadFailureState(error);
    });
  });
});

describe("proxyJsonPut", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serializes JSON body with Content-Type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ saved: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const payload = await proxyJsonPut<{ saved: boolean }>("/api/proxy/v1/example", { value: 1 });

    expect(payload).toEqual({ saved: true });
    expect(fetch).toHaveBeenCalledWith(
      "/api/proxy/v1/example",
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ value: 1 }),
      }),
    );

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);

    expect(headers.get("Content-Type")).toBe("application/json");
  });
});

describe("toApiLoadFailure pass-through", () => {
  it("returns ApiLoadFailureState unchanged", () => {
    const failure = toApiLoadFailure(
      new ApiRequestError("upstream", {
        problem: { title: "Upstream" },
        correlationId: "corr-1",
        httpStatus: 502,
      }),
    );

    expect(toApiLoadFailure(failure)).toBe(failure);
  });
});
