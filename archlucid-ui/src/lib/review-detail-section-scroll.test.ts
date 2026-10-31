import { afterEach, describe, expect, it, vi } from "vitest";

import {
  scheduleScrollToReviewDetailSection,
  scrollToReviewDetailSection,
} from "./review-detail-section-scroll";

describe("scrollToReviewDetailSection", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("expands workspace disclosure and scrolls to the target section", () => {
    document.body.innerHTML = `
      <section id="artifacts-exports">
        <details data-workspace-disclosure>
          <summary>Deliverables</summary>
          <div>Exports</div>
        </details>
      </section>
    `;

    const section = document.getElementById("artifacts-exports");
    const disclosure = section?.querySelector("details");

    expect(disclosure?.open).toBe(false);

    const scrolled = scrollToReviewDetailSection("artifacts-exports");

    expect(scrolled).toBe(true);
    expect(disclosure?.open).toBe(true);
  });

  it("focuses the target section for keyboard users", () => {
    document.body.innerHTML = `
      <section id="artifacts-exports">
        <h2>Deliverables</h2>
      </section>
    `;

    const section = document.getElementById("artifacts-exports");

    expect(section).not.toBeNull();
    expect(document.activeElement).toBe(document.body);

    scrollToReviewDetailSection("artifacts-exports");

    expect(document.activeElement).toBe(section);
    expect(section?.getAttribute("tabindex")).toBe("-1");
  });

  it("writes the section hash after scrolling", () => {
    document.body.innerHTML = `
      <section id="artifacts-exports">
        <h2>Deliverables</h2>
      </section>
    `;

    window.history.replaceState({}, "", "/architecture/reviews/run-1");

    scrollToReviewDetailSection("artifacts-exports");

    expect(window.location.hash).toBe("#artifacts-exports");
  });

  it("keeps retrying until a deferred review section mounts", () => {
    vi.useFakeTimers();
    document.body.innerHTML = "";

    scheduleScrollToReviewDetailSection("deferred-evidence");
    vi.advanceTimersByTime(450);

    const target = document.createElement("section");
    target.id = "deferred-evidence";
    target.scrollIntoView = vi.fn();
    document.body.append(target);

    vi.advanceTimersByTime(50);

    expect(target.scrollIntoView).toHaveBeenCalledOnce();
  });
});
