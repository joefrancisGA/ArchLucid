import { afterEach, describe, expect, it, vi } from "vitest";

import {
  scheduleScrollDeepLinkTargetIntoView,
  scrollDeepLinkTargetIntoView,
} from "@/lib/scroll-deep-link-target-into-view";

describe("scrollDeepLinkTargetIntoView", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("scrolls to the target element when present", () => {
    const target = document.createElement("h2");
    target.id = "finish-setup-heading";
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;
    document.body.append(target);

    expect(scrollDeepLinkTargetIntoView("#finish-setup-heading")).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("returns false when the target is not mounted yet", () => {
    expect(scrollDeepLinkTargetIntoView("missing-anchor")).toBe(false);
  });
});

describe("scheduleScrollDeepLinkTargetIntoView", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("retries until the target appears", () => {
    vi.useFakeTimers();

    const scrollIntoView = vi.fn();
    const target = document.createElement("h2");
    target.id = "delayed-anchor";
    target.scrollIntoView = scrollIntoView;

    scheduleScrollDeepLinkTargetIntoView("delayed-anchor");

    expect(scrollIntoView).not.toHaveBeenCalled();

    document.body.append(target);
    vi.advanceTimersByTime(50);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });
});
