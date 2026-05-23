import { afterEach, describe, expect, it, vi } from "vitest";

import * as sonner from "sonner";

import { showApiError } from "@/lib/api-error-toast";

describe("showApiError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses rich toast content when correlation id is present", () => {
    const spy = vi.spyOn(sonner.toast, "error").mockImplementation(() => "id");

    showApiError("Server error", { detail: "Database timeout", correlationId: "corr-1" });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(typeof spy.mock.calls[0]?.[0]).toBe("function");
  });

  it("falls back to plain text when correlation id is absent", () => {
    const spy = vi.spyOn(sonner.toast, "error").mockImplementation(() => "id");

    showApiError("Server error", { detail: "Database timeout" });

    expect(spy).toHaveBeenCalledWith("Server error — Database timeout");
  });
});
