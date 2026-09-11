import { afterEach, describe, expect, it, vi } from "vitest";

import * as sonner from "sonner";

import {
  resolveToastDuration,
  showError,
  showInfo,
  showMutationError,
  showSuccess,
  TOAST_DEFAULT_DURATION_MS,
  TOAST_STICKY_DURATION,
} from "./toast";

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

    expect(spy).toHaveBeenCalledWith("bad — more", { duration: TOAST_DEFAULT_DURATION_MS });
  });

  it("showError passes sonner description when provided", () => {
    const spy = vi.spyOn(sonner.toast, "error").mockImplementation(() => "id");

    showError("bad", undefined, { description: "field-level detail" });

    expect(spy).toHaveBeenCalledWith("bad", {
      description: "field-level detail",
      duration: TOAST_DEFAULT_DURATION_MS,
    });
  });

  it("showMutationError uses sticky duration", () => {
    const spy = vi.spyOn(sonner.toast, "error").mockImplementation(() => "id");

    showMutationError("Architecture draft", "Could not save.");

    expect(spy).toHaveBeenCalledWith("Architecture draft — Could not save.", {
      duration: TOAST_STICKY_DURATION,
    });
  });

  it("resolveToastDuration prefers explicit duration over sticky", () => {
    expect(resolveToastDuration({ sticky: true, duration: 12_000 })).toBe(12_000);
    expect(resolveToastDuration({ sticky: true })).toBe(TOAST_STICKY_DURATION);
    expect(resolveToastDuration()).toBe(TOAST_DEFAULT_DURATION_MS);
  });

  it("showInfo delegates to sonner.message", () => {
    const spy = vi.spyOn(sonner.toast, "message").mockImplementation(() => "id");

    showInfo("note");

    expect(spy).toHaveBeenCalledWith("note");
  });
});
