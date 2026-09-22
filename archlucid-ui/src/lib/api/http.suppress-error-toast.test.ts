import { afterEach, describe, expect, it, vi } from "vitest";

const showApiRequestErrorToast = vi.fn();

vi.mock("@/lib/api-error-toast", () => ({
  showApiRequestErrorToast,
  showApiError: vi.fn(),
}));

import { throwApiRequestError } from "./http";

describe("throwApiRequestError toast presentation", () => {
  afterEach(() => {
    showApiRequestErrorToast.mockReset();
    vi.unstubAllGlobals();
  });

  it("does not enqueue a 5xx toast by default (inline recovery is the default channel)", () => {
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

    expect(() => throwApiRequestError(response, body, "corr-1")).toThrow();

    expect(showApiRequestErrorToast).not.toHaveBeenCalled();
  });

  it("enqueues a 5xx toast only when showErrorToast is true", async () => {
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

    expect(() => throwApiRequestError(response, body, "corr-2", { showErrorToast: true })).toThrow();

    await vi.waitFor(() => {
      expect(showApiRequestErrorToast).toHaveBeenCalledTimes(1);
    });
  });
});
