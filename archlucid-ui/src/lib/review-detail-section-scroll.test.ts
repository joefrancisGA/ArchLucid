import { describe, expect, it } from "vitest";

import { scrollToReviewDetailSection } from "./review-detail-section-scroll";

describe("scrollToReviewDetailSection", () => {
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
});
