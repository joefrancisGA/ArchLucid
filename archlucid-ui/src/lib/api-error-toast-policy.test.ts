import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import {
  isConnectivityOrAssistantFailure,
  resolveApiRequestErrorToastPlan,
} from "@/lib/api-error-toast-policy";

describe("api-error-toast-policy", () => {
  it("detects UseStream and fetch connectivity failures", () => {
    expect(isConnectivityOrAssistantFailure("UseStream API unreachable: fetch failed")).toBe(true);
    expect(isConnectivityOrAssistantFailure("Upstream API unreachable")).toBe(true);
    expect(isConnectivityOrAssistantFailure("Validation failed")).toBe(false);
  });

  it("suppresses connectivity toast in buyer-polished shell", () => {
    const err = new ApiRequestError("UseStream API unreachable: fetch failed", {
      httpStatus: 500,
      problem: null,
      correlationId: null,
    });

    expect(resolveApiRequestErrorToastPlan(err, true)).toEqual({ action: "suppress" });
  });

  it("reframes connectivity toast as warning in operator shell", () => {
    const err = new ApiRequestError("UseStream API unreachable: fetch failed", {
      httpStatus: 500,
      problem: null,
      correlationId: null,
    });

    expect(resolveApiRequestErrorToastPlan(err, false)).toEqual({
      action: "show",
      title: "Review assistant unavailable",
      detail:
        "The AI assistant service is not reachable. Core review package navigation remains available.",
      type: "warning",
    });
  });
});
