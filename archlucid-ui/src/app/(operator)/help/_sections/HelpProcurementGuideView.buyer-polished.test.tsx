/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/procurement",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { HelpProcurementGuideView } from "@/app/(operator)/help/_sections/HelpProcurementGuideView";
import {
  PROCUREMENT_HELP_CLAIM_DISCIPLINE,
  PROCUREMENT_HELP_FOLLOW_UPS_TITLE,
  PROCUREMENT_HELP_SOURCES,
} from "@/lib/procurement-help-evidence-copy";
import {
  PROCUREMENT_HELP_PAGE_SUBTITLE,
  PROCUREMENT_HELP_PAGE_TITLE,
} from "@/lib/procurement-help-guide-content";
import {
  PROCUREMENT_HELP_BUYER_OVERVIEW,
  PROCUREMENT_HELP_FIRST_VIEWPORT_TEST_ID,
  PROCUREMENT_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  PROCUREMENT_HELP_ORIENTATION_BOTTOM_TEST_ID,
  PROCUREMENT_HELP_PAGE_LEAD,
  PROCUREMENT_HELP_PAGE_SUBTITLE_BUYER,
  PROCUREMENT_HELP_PRIMARY_CONTENT_ID,
  PROCUREMENT_HELP_SKIP_LINK_LABEL,
  PROCUREMENT_HELP_SKIP_TARGET_ID,
  PROCUREMENT_HELP_START_HERE_HELPER,
} from "@/lib/procurement-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpProcurementGuideView buyer-polished shell (PRO)", () => {
  const loaded = tryLoadProductDocumentation("procurement");

  it("renders skip link, intro lead, header claim discipline, first-viewport diligence CTAs, and bottom Sources", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    render(<HelpProcurementGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: PROCUREMENT_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PROCUREMENT_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(PROCUREMENT_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(PROCUREMENT_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(PROCUREMENT_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      PROCUREMENT_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-procurement-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-procurement-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-procurement-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-export-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-procurement-related")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: PROCUREMENT_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-procurement-page-title")).toHaveTextContent(PROCUREMENT_HELP_PAGE_TITLE);
    expect(screen.getByTestId("help-procurement-intro")).toHaveTextContent(PROCUREMENT_HELP_PAGE_LEAD);
    expect(screen.getByTestId("help-procurement-overview")).toHaveTextContent(PROCUREMENT_HELP_BUYER_OVERVIEW);

    const primaryContent = screen.getByTestId(PROCUREMENT_HELP_PRIMARY_CONTENT_ID);
    const buyerFirstViewport = screen.getByTestId(PROCUREMENT_HELP_FIRST_VIEWPORT_TEST_ID);
    const diligenceCtas = screen.getByTestId("procurement-help-diligence-ctas");
    const overview = screen.getByTestId("help-procurement-overview");
    const faqContent = screen.getByTestId("help-procurement-faq-content");
    const orientationBottom = screen.getByTestId(PROCUREMENT_HELP_ORIENTATION_BOTTOM_TEST_ID);

    expect(primaryContent).toContainElement(buyerFirstViewport);
    expect(buyerFirstViewport).toContainElement(diligenceCtas);
    expect(within(diligenceCtas).getByRole("link", { name: "Trust Center" })).toHaveAttribute("href", "/trust");
    expect(screen.getByTestId("help-procurement-start-here-helper")).toHaveTextContent(
      PROCUREMENT_HELP_START_HERE_HELPER,
    );
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(faqContent);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(buyerFirstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(faqContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(faqContent.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const sourcesSection = screen.getByTestId("procurement-help-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(PROCUREMENT_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
