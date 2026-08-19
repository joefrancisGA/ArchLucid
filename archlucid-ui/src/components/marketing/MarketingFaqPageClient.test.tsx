import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MARKETING_FAQ_ITEMS, MARKETING_FAQ_MOST_ASKED_ITEM_IDS } from "@/lib/marketing-faq";
import {
  MARKETING_FAQ_PAGE_INTRO,
  MARKETING_FAQ_PRIMARY_CONTENT_ID,
} from "@/lib/marketing/marketing-faq-page-copy";

import { MarketingFaqPageClient } from "./MarketingFaqPageClient";

describe("MarketingFaqPageClient", () => {
  it("renders buyer intro, category index, hero links, most asked, and diligence CTAs", () => {
    render(<MarketingFaqPageClient />);

    expect(screen.getByRole("link", { name: "Skip to FAQ content" })).toHaveAttribute(
      "href",
      `#${MARKETING_FAQ_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("marketing-faq-page-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Product FAQ" })).toBeInTheDocument();
    expect(screen.getByText(MARKETING_FAQ_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("faq-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-toc")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-cta-top")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-hero-links")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to overview" })).toHaveAttribute("href", "/welcome");
    expect(screen.getByTestId("marketing-faq-hero-links").querySelector('a[href="/pricing"]')).toHaveTextContent(
      "View pricing",
    );
    expect(screen.getByTestId("marketing-faq-most-asked")).toBeInTheDocument();
    expect(screen.getByTestId("marketing-faq-diligence-ctas")).toBeInTheDocument();
    expect(screen.getByTestId("faq-orientation")).toBeInTheDocument();
  });

  it("places evaluation orientation above Most asked", () => {
    render(<MarketingFaqPageClient />);

    const orientationTop = screen.getByTestId("faq-orientation-top");
    const mostAsked = screen.getByTestId("marketing-faq-most-asked");

    expect(orientationTop.compareDocumentPosition(mostAsked) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("browses by category without an in-page search box", () => {
    render(<MarketingFaqPageClient />);

    expect(screen.queryByTestId("marketing-faq-search")).not.toBeInTheDocument();
    expect(screen.queryByTestId("marketing-faq-search-status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("marketing-faq-empty")).not.toBeInTheDocument();

    const toc = screen.getByTestId("marketing-faq-toc");

    expect(within(toc).getByRole("link", { name: "Product basics" })).toBeInTheDocument();
    expect(within(toc).getByRole("link", { name: "Evaluation and first review" })).toBeInTheDocument();
  });

  // Each panel id doubles as the /faq#<id> deep-link target, so a duplicate render
  // would emit duplicate DOM ids and send the anchor to the wrong panel.
  it("renders every question exactly once so hash deep-link ids stay unique", () => {
    render(<MarketingFaqPageClient />);

    MARKETING_FAQ_ITEMS.forEach((item) => {
      expect(screen.getAllByTestId(`marketing-faq-item-${item.id}`), item.id).toHaveLength(1);
    });
  });

  it("promotes most-asked questions out of their category sections", () => {
    render(<MarketingFaqPageClient />);

    const mostAsked = screen.getByTestId("marketing-faq-most-asked");

    MARKETING_FAQ_MOST_ASKED_ITEM_IDS.forEach((itemId) => {
      expect(within(mostAsked).getByTestId(`marketing-faq-item-${itemId}`)).toBeInTheDocument();
    });
  });

  it("renders related links for comparison and procurement answers", () => {
    render(<MarketingFaqPageClient />);

    expect(screen.getByRole("link", { name: "Why ArchLucid" })).toHaveAttribute("href", "/why");
    expect(screen.getAllByRole("link", { name: "Procurement FAQ" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Sample showcase" }).length).toBeGreaterThan(0);
  });
});
