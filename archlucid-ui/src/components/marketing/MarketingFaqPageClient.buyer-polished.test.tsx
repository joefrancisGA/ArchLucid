import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FAQ_CLAIM_DISCIPLINE, FAQ_SOURCES } from "@/lib/faq-evidence-copy";
import { EVALUATION_SOURCES_TITLE } from "@/lib/evaluation-sources-title";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import {
  MARKETING_FAQ_FIRST_VIEWPORT_ID,
  MARKETING_FAQ_PAGE_INTRO,
  MARKETING_FAQ_PAGE_TITLE,
  MARKETING_FAQ_PRIMARY_CONTENT_ID,
  MARKETING_FAQ_SKIP_LINK_LABEL,
  MARKETING_FAQ_SKIP_TARGET_ID,
} from "@/lib/marketing/marketing-faq-page-copy";

import { MarketingFaqPageClient } from "./MarketingFaqPageClient";

describe("MarketingFaqPageClient buyer-polished shell", () => {
  it("renders skip link, orientation above Most asked, and Sources links", () => {
    render(<MarketingFaqPageClient />);

    expect(screen.getByRole("link", { name: MARKETING_FAQ_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${MARKETING_FAQ_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("marketing-faq-primary-content")).toHaveAttribute(
      "id",
      MARKETING_FAQ_PRIMARY_CONTENT_ID,
    );

    const primaryContent = screen.getByTestId("marketing-faq-primary-content");
    const hero = screen.getByTestId("marketing-faq-page-hero");
    const firstViewport = screen.getByTestId(MARKETING_FAQ_FIRST_VIEWPORT_ID);
    const orientationTop = screen.getByTestId("faq-orientation-top");
    const mostAsked = screen.getByTestId("marketing-faq-most-asked");
    const sourcesSection = screen.getByTestId("faq-sources");

    expect(primaryContent).toContainElement(hero);
    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).not.toContainElement(hero);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(mostAsked);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(mostAsked) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(within(orientationTop).getByTestId("marketing-faq-claim-discipline").textContent).toContain(
      FAQ_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 1, name: MARKETING_FAQ_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(MARKETING_FAQ_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: EVALUATION_SOURCES_TITLE })).toBeInTheDocument();
    expect(screen.getAllByTestId("faq-sources")).toHaveLength(1);

    for (const source of filterWhereToGoNextFollowUpLinks(FAQ_SOURCES)) {
      expect(within(sourcesSection).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });
});
