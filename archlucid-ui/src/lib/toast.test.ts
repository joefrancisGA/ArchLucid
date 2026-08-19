import { afterEach, describe, expect, it, vi } from "vitest";

import * as sonner from "sonner";

import { showError, showInfo, showSuccess } from "./toast";

describe("toast helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("showSuccess delegates to sonner.success", () => {
    const spy = vi.spyOn(sonner.toast, "success").mockImplementation(() => "id");

    showSuccess("ok");

    expect(spy).toHaveBeenCalledWith("ok");
  });

  it("showError appends detail when provided", () => {
    const spy = vi.spyOn(sonner.toast, "error").mockImplementation(() => "id");

    showError("bad", "more");

    expect(spy).toHaveBeenCalledWith("bad — more");
  });

  it("showInfo delegates to sonner.message", () => {
    const spy = vi.spyOn(sonner.toast, "message").mockImplementation(() => "id");

    showInfo("note");

    expect(spy).toHaveBeenCalledWith("note");
  });
});
