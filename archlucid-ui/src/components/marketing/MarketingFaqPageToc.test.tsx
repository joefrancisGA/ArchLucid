import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MarketingFaqCategory } from "@/lib/marketing-faq";

import { MarketingFaqPageToc } from "./MarketingFaqPageToc";

const categories: readonly MarketingFaqCategory[] = [
  { id: "security-trust", title: "Security and trust", intro: "Security details." },
];

describe("MarketingFaqPageToc", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/faq");
    vi.restoreAllMocks();
  });

  it("updates the URL hash when a category link is selected", () => {
    const scrollIntoView = vi
      .spyOn(HTMLElement.prototype, "scrollIntoView")
      .mockImplementation(() => undefined);

    render(
      <>
        <section id="security-trust">Security and trust</section>
        <MarketingFaqPageToc categories={categories} />
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Security and trust" }));

    expect(window.location.hash).toBe("#security-trust");
    expect(scrollIntoView).toHaveBeenCalled();
  });
});
