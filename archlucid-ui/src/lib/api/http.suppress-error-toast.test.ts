import { afterEach, describe, expect, it, vi } from "vitest";

const showApiRequestErrorToast = vi.fn();

vi.mock("@/lib/api-error-toast", () => ({
  showApiRequestErrorToast,
  showApiError: vi.fn(),
}));

import { throwApiRequestError } from "./http";

describe("throwApiRequestError suppressErrorToast", () => {
  afterEach(() => {
    showApiRequestErrorToast.mockReset();
    vi.unstubAllGlobals();
  });

  it("does not enqueue a 5xx toast when suppressErrorToast is true", () => {
    vi.stubGlobal("window", {} as Window);

    const body = JSON.stringify({
      title: "Upstream API unreachable",
      detail: "GET /v1/learning/plans timed out",
      status: 502,
    });

    const response = new Response(body, {
      status: 502,
      headers: { "content-type": "application/problem+json" },
    });

    expect(() => throwApiRequestError(response, body, "corr-1", { suppressErrorToast: true })).toThrow();

    expect(showApiRequestErrorToast).not.toHaveBeenCalled();
  });

  it("still enqueues a 5xx toast by default", async () => {
    vi.stubGlobal("window", {} as Window);

    const body = JSON.stringify({
      title: "Upstream API unreachable",
      detail: "GET /v1/learning/plans timed out",
      status: 502,
    });

    const response = new Response(body, {
      status: 502,
      headers: { "content-type": "application/problem+json" },
    });

    expect(() => throwApiRequestError(response, body, "corr-2")).toThrow();

    await vi.waitFor(() => {
      expect(showApiRequestErrorToast).toHaveBeenCalledTimes(1);
    });
  });
});
