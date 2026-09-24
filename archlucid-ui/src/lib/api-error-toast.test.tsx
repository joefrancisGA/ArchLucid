import { afterEach, describe, expect, it, vi } from "vitest";

import * as sonner from "sonner";

import { ApiRequestError } from "@/lib/api-request-error";
import { showApiError, showApiRequestErrorToast, showMutationApiError } from "@/lib/api-error-toast";
import { PRODUCT_LINE_COOKIE } from "@/lib/product-line/product-line-storage";
import { TOAST_DEFAULT_DURATION_MS, TOAST_STICKY_DURATION } from "@/lib/toast";

describe("showApiError", () => {
  afterEach(() => {
    document.cookie = `${PRODUCT_LINE_COOKIE}=; Max-Age=0; Path=/`;
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

  it("uses the cookie-selected product line for connectivity errors", () => {
    document.cookie = `${PRODUCT_LINE_COOKIE}=security; Path=/`;
    const spy = vi.spyOn(sonner.toast, "warning").mockImplementation(() => "id");
    const err = new ApiRequestError("failed to fetch", {
      problem: null,
      correlationId: null,
      httpStatus: 0,
    });

    showApiRequestErrorToast(err);

    expect(spy).toHaveBeenCalledWith(
      "Cannot reach SecureNow API — Network or transport failure while calling the API.",
      { duration: TOAST_DEFAULT_DURATION_MS },
    );
  });
});
