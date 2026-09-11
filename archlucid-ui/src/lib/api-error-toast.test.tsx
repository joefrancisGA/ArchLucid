import { afterEach, describe, expect, it, vi } from "vitest";

import * as sonner from "sonner";

import { showApiError, showMutationApiError } from "@/lib/api-error-toast";
import { TOAST_DEFAULT_DURATION_MS, TOAST_STICKY_DURATION } from "@/lib/toast";

describe("showApiError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses rich toast content when correlation id is present", () => {
    const spy = vi.spyOn(sonner.toast, "error").mockImplementation(() => "id");

    showApiError("Server error", { detail: "Database timeout", correlationId: "corr-1" });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(typeof spy.mock.calls[0]?.[0]).toBe("function");
    expect(spy.mock.calls[0]?.[1]).toEqual({ duration: TOAST_DEFAULT_DURATION_MS });
  });

  it("falls back to plain text when correlation id is absent", () => {
    const spy = vi.spyOn(sonner.toast, "error").mockImplementation(() => "id");

    showApiError("Server error", { detail: "Database timeout" });

    expect(spy).toHaveBeenCalledWith("Server error — Database timeout", {
      duration: TOAST_DEFAULT_DURATION_MS,
    });
  });

  it("showMutationApiError uses sticky duration for plain text", () => {
    const spy = vi.spyOn(sonner.toast, "error").mockImplementation(() => "id");

    showMutationApiError("Share review", { detail: "Server rejected the grant." });

    expect(spy).toHaveBeenCalledWith("Share review — Server rejected the grant.", {
      duration: TOAST_STICKY_DURATION,
    });
  });

  it("uses rich toast content when validation field errors are present", () => {
    const spy = vi.spyOn(sonner.toast, "error").mockImplementation(() => "id");

    showApiError("Request validation failed (HTTP 400)", {
      detail: "The request body failed server-side validation. See each field below.",
      endpointLine: "POST /v1/architecture/request returned HTTP 400 — correct the fields below and retry.",
      validationFields: [{ field: "Description", messages: ["Description must not exceed 4000 characters."] }],
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(typeof spy.mock.calls[0]?.[0]).toBe("function");
  });
});
