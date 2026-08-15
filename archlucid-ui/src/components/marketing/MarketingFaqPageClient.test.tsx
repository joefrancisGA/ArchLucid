import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingFaqPageClient } from "./MarketingFaqPageClient";

describe("MarketingFaqPageClient", () => {
  it("renders buyer intro, category index, hero links, most asked, and diligence CTAs", () => {
    render(<MarketingFaqPageClient />);

    expect(screen.getByTestId("marketing-faq-page-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Product FAQ" })).toBeInTheDocument();
    expect(screen.getByText("Answers for architects and sponsors evaluating ArchLucid.")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-toc")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-cta-top")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-hero-links")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to overview" })).toHaveAttribute("href", "/welcome");
    expect(screen.getByTestId("marketing-faq-hero-links").querySelector('a[href="/pricing"]')).toHaveTextContent(
      "View pricing",
    );
    expect(screen.getByTestId("marketing-faq-most-asked")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-diligence-ctas")).toBeInTheDocument();
    expect(screen.getByTestId("faq-orientation-claim")).toBeInTheDocument();
    expect(screen.getByTestId("faq-orientation-sources")).toBeInTheDocument();
  });

  it("filters accordion items and the table of contents when searching", () => {
    render(<MarketingFaqPageClient />);

    fireEvent.change(screen.getByTestId("marketing-faq-search"), { target: { value: "one architect" } });

    expect(screen.getByTestId("marketing-faq-item-one-architect-license")).toBeInTheDocument();
    expect(screen.queryByTestId("marketing-faq-item-what-is-archlucid")).not.toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-search-status")).toHaveTextContent("Showing 1 of 21 questions.");

    const toc = screen.getByTestId("marketing-faq-toc");

    expect(within(toc).getByRole("link", { name: "Evaluation and first review" })).toBeInTheDocument();
    expect(within(toc).queryByRole("link", { name: "Product basics" })).not.toBeInTheDocument();
  });

  it("announces the empty search state with a clear-search action", () => {
    render(<MarketingFaqPageClient />);

    fireEvent.change(screen.getByTestId("marketing-faq-search"), { target: { value: "zzzz-no-match" } });

    expect(screen.getByTestId("marketing-faq-empty")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });

  it("renders related links for comparison and procurement answers", () => {
    render(<MarketingFaqPageClient />);

    expect(screen.getByRole("link", { name: "Why ArchLucid" })).toHaveAttribute("href", "/why");
    expect(screen.getAllByRole("link", { name: "Procurement FAQ" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Sample showcase" }).length).toBeGreaterThan(0);
  });
});
