import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  findBlockingOverlayElement,
  installClientRuntimeDiagnostics,
} from "@/lib/client-runtime-diagnostics";

describe("client-runtime-diagnostics", () => {
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    vi.stubGlobal("location", {
      ...window.location,
      pathname: "/",
      search: "",
      origin: "http://localhost",
      assign,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("findBlockingOverlayElement returns a high-z full-viewport fixed layer", () => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.pointerEvents = "auto";
    overlay.style.opacity = "0.5";
    overlay.style.zIndex = "10000";
    overlay.setAttribute("data-testid", "stuck-overlay");
    document.body.appendChild(overlay);

    Object.defineProperty(overlay, "getBoundingClientRect", {
      value: () => ({
        width: window.innerWidth,
        height: window.innerHeight,
        top: 0,
        left: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });

    expect(findBlockingOverlayElement()?.getAttribute("data-testid")).toBe("stuck-overlay");
  });

  it("reports navigation-stuck and hard-navigates when soft-nav never commits", () => {
    vi.useFakeTimers();
    const report = vi.fn();
    const handle = installClientRuntimeDiagnostics(report);

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/reviews/claims-intake-modernization");
    document.body.appendChild(anchor);
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    vi.advanceTimersByTime(8_000);

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "navigation-stuck",
        href: "/reviews/claims-intake-modernization",
        detail: expect.stringContaining("hardFallback=/reviews/claims-intake-modernization"),
      }),
    );
    expect(assign).toHaveBeenCalledWith("/reviews/claims-intake-modernization");

    handle.dispose();
  });

  it("can disable hard-nav recovery while still reporting stuck", () => {
    vi.useFakeTimers();
    const report = vi.fn();
    const handle = installClientRuntimeDiagnostics(report, { hardNavigateOnStuck: false });

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/help/core-pilot");
    document.body.appendChild(anchor);
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    vi.advanceTimersByTime(8_000);

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "navigation-stuck",
        href: "/help/core-pilot",
      }),
    );
    expect(assign).not.toHaveBeenCalled();

    handle.dispose();
  });

  it("clears navigation-stuck watch onLocationCommitted", () => {
    vi.useFakeTimers();
    const report = vi.fn();
    const handle = installClientRuntimeDiagnostics(report);

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/help/core-pilot");
    document.body.appendChild(anchor);
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    handle.onLocationCommitted();
    vi.advanceTimersByTime(8_000);

    expect(report).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
    handle.dispose();
  });
});
