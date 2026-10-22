import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import { formatVerboseApiFailureMessage, resolveApiErrorMessage } from "@/lib/resolve-api-error-message";

describe("resolveApiErrorMessage", () => {
  it("prefers ProblemDetails detail on ApiRequestError", () => {
    const error = new ApiRequestError("wrapper", {
      problem: { detail: "Tenant not entitled", title: "Forbidden", status: 403, type: "about:blank" },
      correlationId: "corr-1",
      httpStatus: 403,
    });

    expect(resolveApiErrorMessage(error, "fallback")).toBe("Tenant not entitled");
  });

  it("falls back to Error.message then caller fallback", () => {
    expect(resolveApiErrorMessage(new Error("network down"), "fallback")).toBe("network down");
    expect(resolveApiErrorMessage({}, "fallback")).toBe("fallback");
  });
});

describe("formatVerboseApiFailureMessage", () => {
  it("includes HTTP status, title, type, and correlation id for ApiRequestError", () => {
    const error = new ApiRequestError("Request failed (401 Unauthorized)", {
      problem: {
        detail: "Authentication is required.",
        title: "Unauthorized",
        status: 401,
        type: "https://httpstatuses.com/401",
      },
      correlationId: "corr-abc",
      httpStatus: 401,
    });

    const message = formatVerboseApiFailureMessage(error, "Could not start a new architecture draft. Try again.");

    expect(message).toContain("Could not start a new architecture draft. Try again.");
    expect(message).toContain("Authentication is required.");
    expect(message).toContain("HTTP 401");
    expect(message).toContain("Title: Unauthorized");
    expect(message).toContain("Type: https://httpstatuses.com/401");
    expect(message).toContain("Correlation ID: corr-abc");
  });

  it("still returns the fallback when the failure is unknown", () => {
    expect(formatVerboseApiFailureMessage(null, "fallback")).toBe("fallback");
  });
});
