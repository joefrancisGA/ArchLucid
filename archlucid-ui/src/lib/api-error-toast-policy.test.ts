import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import {
  classifyApiConnectivityFailure,
  isConnectivityOrAssistantFailure,
  resolveApiRequestErrorToastPlan,
} from "@/lib/api-error-toast-policy";

describe("api-error-toast-policy", () => {
  it("detects UseStream and upstream connectivity failures", () => {
    expect(isConnectivityOrAssistantFailure("UseStream API unreachable: fetch failed")).toBe(true);
    expect(isConnectivityOrAssistantFailure("Upstream API unreachable")).toBe(true);
    expect(isConnectivityOrAssistantFailure("Validation failed")).toBe(false);
  });

  it("classifies proxy 502 as upstream API unreachable", () => {
    expect(
      classifyApiConnectivityFailure({
        message: "Upstream API unreachable: fetch failed",
        httpStatus: 502,
        problem: { supportHint: "Start ArchLucid.Api on port 5128." },
      }),
    ).toBe("upstream-unreachable");
  });

  it("suppresses connectivity toast in buyer-polished shell", () => {
    const err = new ApiRequestError("Upstream API unreachable: fetch failed", {
      httpStatus: 502,
      problem: null,
      correlationId: null,
    });

    expect(resolveApiRequestErrorToastPlan(err, true)).toEqual({ action: "suppress" });
  });

  it("shows API unreachable toast for proxy 502 in operator shell", () => {
    const err = new ApiRequestError("Upstream API unreachable: fetch failed", {
      httpStatus: 502,
      problem: null,
      correlationId: "corr-502",
    });

    expect(resolveApiRequestErrorToastPlan(err, false)).toMatchObject({
      action: "show",
      title: "ArchLucid API unreachable",
      type: "warning",
    });
  });

  it("keeps assistant wording for UseStream-only failures", () => {
    const err = new ApiRequestError("UseStream API unreachable: fetch failed", {
      httpStatus: 500,
      problem: null,
      correlationId: null,
    });

    expect(resolveApiRequestErrorToastPlan(err, false)).toEqual({
      action: "show",
      title: "Review assistant unavailable",
      detail:
        "The review assistant stream could not be reached. Core review package navigation remains available.",
      type: "warning",
    });
  });
});
