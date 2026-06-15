import { beforeEach, describe, expect, it, vi } from "vitest";

import { CORRELATION_ID_HEADER } from "@/lib/correlation";
import { fetchExecutiveRoiSummaryClient } from "@/lib/fetch-executive-roi-summary-client";
import { ApiRequestError } from "@/lib/api-request-error";

describe("fetchExecutiveRoiSummaryClient", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", {
      randomUUID: () => "client-req-executive-roi",
    });
  });

  it("returns parsed summary on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ systemCount: 2 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const summary = await fetchExecutiveRoiSummaryClient();

    expect(summary.systemCount).toBe(2);
  });

  it("throws ApiRequestError with client correlation id when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(new Headers(init?.headers).get(CORRELATION_ID_HEADER)).toBe("client-req-executive-roi");

        return new Response("plain failure", {
          status: 502,
          statusText: "Bad Gateway",
        });
      }),
    );

    await expect(fetchExecutiveRoiSummaryClient()).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(ApiRequestError);
      expect((error as ApiRequestError).correlationId).toBe("client-req-executive-roi");

      return true;
    });
  });
});
