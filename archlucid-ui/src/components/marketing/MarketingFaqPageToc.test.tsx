import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("marks the active category as the current in-page location", () => {
    render(<MarketingFaqPageToc categories={categories} />);

    expect(screen.getByRole("link", { name: "Security and trust" })).toHaveAttribute("aria-current", "location");
  });

  it("marks the TOC category matching the location hash when the hash changes", async () => {
    const multi: readonly MarketingFaqCategory[] = [
      { id: "product-basics", title: "Product basics", intro: "Basics." },
      { id: "security-trust", title: "Security and trust", intro: "Security." },
    ];

    render(
      <>
        <section id="product-basics" />
        <section id="security-trust" />
        <MarketingFaqPageToc categories={multi} />
      </>,
    );

    window.history.replaceState(null, "", "#security-trust");
    window.dispatchEvent(new Event("hashchange"));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Product basics" })).not.toHaveAttribute("aria-current");
      expect(screen.getByRole("link", { name: "Security and trust" })).toHaveAttribute("aria-current", "location");
    });
  });

  it("highlights the parent category when the hash targets an FAQ answer id", async () => {
    const multi: readonly MarketingFaqCategory[] = [
      { id: "product-basics", title: "Product basics", intro: "Basics." },
      { id: "security-trust", title: "Security and trust", intro: "Security." },
    ];

    render(
      <>
        <details id="who-is-archlucid-for" />
        <section id="product-basics" />
        <section id="security-trust" />
        <MarketingFaqPageToc categories={multi} />
      </>,
    );

    window.history.replaceState(null, "", "#who-is-archlucid-for");
    window.dispatchEvent(new Event("hashchange"));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Product basics" })).toHaveAttribute("aria-current", "location");
      expect(screen.getByRole("link", { name: "Security and trust" })).not.toHaveAttribute("aria-current");
    });
  });
});
