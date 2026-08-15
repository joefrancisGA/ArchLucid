import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  findBlockingOverlayElement,
  installClientRuntimeDiagnostics,
} from "@/lib/client-runtime-diagnostics";

type MockPerformanceObserverEntry = {
  readonly duration: number;
  readonly attribution?: ReadonlyArray<{ name?: string; containerType?: string; containerSrc?: string }>;
};

class MockPerformanceObserver {
  static instances: MockPerformanceObserver[] = [];

  private readonly callback: (list: { getEntries: () => MockPerformanceObserverEntry[] }) => void;

  constructor(callback: (list: { getEntries: () => MockPerformanceObserverEntry[] }) => void) {
    this.callback = callback;
    MockPerformanceObserver.instances.push(this);
  }

  observe(): void {}

  disconnect(): void {}

  emit(entries: MockPerformanceObserverEntry[]): void {
    this.callback({ getEntries: () => entries });
  }
}

function setDocumentVisibility(hidden: boolean): void {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    writable: true,
    value: hidden,
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    writable: true,
    value: hidden ? "hidden" : "visible",
  });
}

describe("client-runtime-diagnostics", () => {
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    MockPerformanceObserver.instances = [];
    vi.stubGlobal("location", {
      ...window.location,
      pathname: "/",
      search: "",
      origin: "http://localhost",
      assign,
    });
    setDocumentVisibility(false);
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

  it("findBlockingOverlayElement ignores the client diagnostics banner", () => {
    const banner = document.createElement("div");
    banner.setAttribute("data-testid", "client-runtime-diagnostics-banner");
    banner.style.position = "fixed";
    banner.style.inset = "0";
    banner.style.width = "100vw";
    banner.style.height = "100vh";
    banner.style.pointerEvents = "auto";
    banner.style.opacity = "1";
    banner.style.zIndex = "10000";
    document.body.appendChild(banner);

    Object.defineProperty(banner, "getBoundingClientRect", {
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

    expect(findBlockingOverlayElement()).toBeNull();
  });

  it("does not report main-thread-stall while the document is hidden", () => {
    vi.useFakeTimers();
    setDocumentVisibility(true);
    vi.stubGlobal("PerformanceObserver", undefined);

    const report = vi.fn();
    const handle = installClientRuntimeDiagnostics(report);

    vi.advanceTimersByTime(10_000);

    expect(report).not.toHaveBeenCalledWith(
      expect.objectContaining({ kind: "main-thread-stall" }),
    );

    handle.dispose();
  });

  it("resets heartbeat baseline when the document becomes visible", () => {
    vi.useFakeTimers();
    setDocumentVisibility(true);
    vi.stubGlobal("PerformanceObserver", undefined);

    const report = vi.fn();
    const handle = installClientRuntimeDiagnostics(report);

    vi.advanceTimersByTime(10_000);

    setDocumentVisibility(false);
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(2_000);

    expect(report).not.toHaveBeenCalledWith(
      expect.objectContaining({ kind: "main-thread-stall" }),
    );

    handle.dispose();
  });

  it("reports main-thread-stall from heartbeat when visible and long-task observer is unavailable", () => {
    vi.useFakeTimers();
    setDocumentVisibility(false);
    vi.stubGlobal("PerformanceObserver", undefined);

    let now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    const report = vi.fn();
    const handle = installClientRuntimeDiagnostics(report);

    now = 6_000;
    vi.advanceTimersByTime(2_000);

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "main-thread-stall",
        message: expect.stringContaining("heartbeat delayed"),
        detail: expect.stringContaining("source=heartbeat"),
      }),
    );

    handle.dispose();
  });

  it("reports main-thread-stall once from long-task observer", () => {
    vi.stubGlobal("PerformanceObserver", MockPerformanceObserver);

    const report = vi.fn();
    const handle = installClientRuntimeDiagnostics(report);
    const observer = MockPerformanceObserver.instances[0];

    observer.emit([
      {
        duration: 6_000,
        attribution: [{ name: "self", containerType: "window" }],
      },
    ]);
    observer.emit([
      {
        duration: 7_000,
        attribution: [{ name: "self", containerType: "window" }],
      },
    ]);

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "main-thread-stall",
        message: expect.stringContaining("long task"),
        detail: expect.stringContaining("source=longtask"),
      }),
    );

    handle.dispose();
  });

  it("reports navigation-stuck and hard-navigates when soft-nav never commits", () => {
    vi.useFakeTimers();
    const report = vi.fn();
    const handle = installClientRuntimeDiagnostics(report);

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/architecture/reviews/customer-intake-modernization");
    document.body.appendChild(anchor);
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    vi.advanceTimersByTime(8_000);

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "navigation-stuck",
        href: "/architecture/reviews/customer-intake-modernization",
        detail: expect.stringContaining("hardFallback=/architecture/reviews/customer-intake-modernization"),
      }),
    );
    expect(assign).toHaveBeenCalledWith("/architecture/reviews/customer-intake-modernization");

    handle.dispose();
  });

  it("can disable hard-nav recovery while still reporting stuck", () => {
    vi.useFakeTimers();
    const report = vi.fn();
    const handle = installClientRuntimeDiagnostics(report, { hardNavigateOnStuck: false });

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/help/first-architecture-review");
    document.body.appendChild(anchor);
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    vi.advanceTimersByTime(8_000);

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "navigation-stuck",
        href: "/help/first-architecture-review",
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
    anchor.setAttribute("href", "/help/first-architecture-review");
    document.body.appendChild(anchor);
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    handle.onLocationCommitted();
    vi.advanceTimersByTime(8_000);

    expect(report).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
    handle.dispose();
  });
});
