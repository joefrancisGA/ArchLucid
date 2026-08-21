import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => null,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => null,
}));

import { HelpGlossaryPageView } from "@/app/(operator)/help/_sections/HelpGlossaryPageView";
import {
  CUSTOMER_GLOSSARY_EMPTY_STATE,
  CUSTOMER_GLOSSARY_FEATURED_TERMS_LABEL,
  CUSTOMER_GLOSSARY_PAGE_INTRO,
  CUSTOMER_GLOSSARY_PAGE_TITLE,
  CUSTOMER_GLOSSARY_SEARCH_LABEL,
} from "@/lib/customer-glossary-copy";
import { CUSTOMER_GLOSSARY_CONTRACT_VERSION } from "@/lib/customer-glossary-manifest";
import { GLOSSARY_HELP_CLAIM_DISCIPLINE, GLOSSARY_HELP_FOLLOW_UP_LINKS } from "@/lib/glossary-help-evidence-copy";
import { GLOSSARY_HELP_PRIMARY_ACTIONS } from "@/lib/glossary-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const BANNED_INTERNAL_COPY = [
  "Record-type field taxonomy",
  "Implementation alignment",
  "Finding field schema",
  "Decision field schema",
  "Risk field schema",
  "Control field schema",
  "ArchLucid.Decisioning",
  "payload",
  "TenantId",
] as const;

function collectInPageAnchorIds(container: HTMLElement): string[] {
  const anchors = within(container).queryAllByRole("link");
  const ids: string[] = [];

  for (const anchor of anchors) {
    const href = anchor.getAttribute("href");

    if (href === null || !href.startsWith("#") || href.length <= 1) {
      continue;
    }

    ids.push(href.slice(1));
  }

  return ids;
}

describe("HelpGlossaryPageView", () => {
  const entry = getProductDocumentationEntry("glossary");

  it("registers the glossary help entry", () => {
    expect(entry?.slug).toBe("glossary");
    expect(entry?.title).toBe(CUSTOMER_GLOSSARY_PAGE_TITLE);
    expect(entry?.lastReviewed).toBe(CUSTOMER_GLOSSARY_CONTRACT_VERSION);
  });

  it("renders help-topic header chrome and claim-discipline orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    expect(screen.getByTestId("help-topic-page-title")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.getByTestId("glossary-help-claim-discipline")).toHaveTextContent(GLOSSARY_HELP_CLAIM_DISCIPLINE);
    expect(screen.getByTestId("help-glossary-action-panel")).toBeInTheDocument();
    const actionPanel = screen.getByTestId("help-glossary-action-panel");
    expect(within(actionPanel).getByRole("link", { name: GLOSSARY_HELP_PRIMARY_ACTIONS.openReviews.label })).toHaveAttribute(
      "href",
      GLOSSARY_HELP_PRIMARY_ACTIONS.openReviews.href,
    );
    expect(
      within(actionPanel).getByRole("link", { name: GLOSSARY_HELP_PRIMARY_ACTIONS.openFindingsGuide.label }),
    ).toHaveAttribute("href", GLOSSARY_HELP_PRIMARY_ACTIONS.openFindingsGuide.href);
    expect(
      within(actionPanel).getByRole("link", { name: GLOSSARY_HELP_PRIMARY_ACTIONS.openFirstReviewGuide.label }),
    ).toHaveAttribute("href", GLOSSARY_HELP_PRIMARY_ACTIONS.openFirstReviewGuide.href);

    for (const link of GLOSSARY_HELP_FOLLOW_UP_LINKS) {
      expect(within(screen.getByTestId("glossary-help-claim-discipline")).getByRole("link", { name: link.label })).toHaveAttribute(
        "href",
        link.href,
      );
    }

    const helpTopic = pageHelpTopicForPathname("/help/glossary");

    expect(helpTopic).not.toBeNull();
    expect(helpTopic?.slug).toBe("glossary");
  });

  it("renders one H1 and customer intro copy without internal schema sections", () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    expect(screen.getAllByRole("heading", { level: 1, name: CUSTOMER_GLOSSARY_PAGE_TITLE })).toHaveLength(1);
    expect(screen.getByText(CUSTOMER_GLOSSARY_PAGE_INTRO)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Search and browse" })).toBeInTheDocument();
    expect(screen.getByLabelText(CUSTOMER_GLOSSARY_SEARCH_LABEL)).toBeInTheDocument();
    expect(screen.getByText(CUSTOMER_GLOSSARY_FEATURED_TERMS_LABEL)).toBeInTheDocument();

    const featuredTerms = screen.getByTestId("glossary-featured-terms");
    expect(within(featuredTerms).getByRole("button", { name: "Finding" })).toBeInTheDocument();
    expect(within(featuredTerms).getByRole("button", { name: "Finalized review record" })).toBeInTheDocument();

    for (const banned of BANNED_INTERNAL_COPY) {
      expect(screen.queryByText(new RegExp(banned, "i"))).toBeNull();
    }
  });

  it("supports search, category filters, and empty state", async () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    expect(screen.getByTestId("glossary-term-finding")).toBeInTheDocument();
    expect(screen.getByTestId("glossary-term-review")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("glossary-search-input"), { target: { value: "zzzz-no-match" } });

    expect(screen.getByTestId("glossary-empty-state")).toHaveTextContent(CUSTOMER_GLOSSARY_EMPTY_STATE);

    fireEvent.change(screen.getByTestId("glossary-search-input"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Evidence" }));

    expect(screen.getByTestId("glossary-term-evidence-trail")).toBeInTheDocument();
    expect(screen.queryByTestId("glossary-term-finding")).toBeNull();
  });

  it("links related terms and uses glossary category navigation", () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    const findingTerm = screen.getByTestId("glossary-term-finding");
    const riskLink = within(findingTerm).getByRole("link", { name: "Risk" });

    expect(riskLink).toHaveAttribute("href", "#term-risk");

    const toc = screen.getByTestId("help-topic-toc");
    expect(within(toc).getByRole("link", { name: "Search and browse" })).toHaveAttribute("href", "#glossary-search");
    expect(within(toc).getByRole("link", { name: "Review process" })).toHaveAttribute("href", "#category-review-process");
    expect(within(toc).queryByRole("link", { name: /Finding fields/i })).toBeNull();
  });

  it("jumps to featured terms after clearing an active category filter", () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    fireEvent.click(screen.getByRole("button", { name: "Evidence" }));
    expect(screen.queryByTestId("glossary-term-finding")).toBeNull();

    fireEvent.click(within(screen.getByTestId("glossary-featured-terms")).getByRole("button", { name: "Finding" }));

    expect(screen.getByTestId("glossary-term-finding")).toBeInTheDocument();
    expect(document.getElementById("term-finding")).not.toBeNull();
  });

  it("keeps in-page anchor targets present when the Evidence filter is active", () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    fireEvent.click(screen.getByRole("button", { name: "Evidence" }));

    const primary = screen.getByTestId("help-glossary-primary");
    const toc = screen.queryByTestId("help-topic-toc") ?? screen.queryByTestId("help-topic-toc-mobile");
    const anchorIds = [...collectInPageAnchorIds(primary), ...(toc !== null ? collectInPageAnchorIds(toc) : [])];

    expect(anchorIds.length).toBeGreaterThan(0);

    for (const anchorId of anchorIds) {
      expect(document.getElementById(anchorId)).not.toBeNull();
    }

    expect(screen.queryByTestId("glossary-letter-index")).not.toHaveTextContent("M");
  });

  it("shows deprecated aliases for sealed review record without using Signed manifest as the label", () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    const signedTerm = screen.getByTestId("glossary-term-sealed-review-record");

    expect(within(signedTerm).getByRole("heading", { level: 3, name: "Finalized review record" })).toBeInTheDocument();
    expect(within(signedTerm).getByText(/Signed manifest/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: "Signed manifest" })).toBeNull();
  });

  it("announces result counts when filtering", async () => {
    if (entry === undefined) {
      throw new Error("Expected glossary documentation entry.");
    }

    render(<HelpGlossaryPageView entry={entry} />);

    fireEvent.change(screen.getByTestId("glossary-search-input"), { target: { value: "audit" } });

    expect(screen.getByRole("status")).toHaveTextContent(/term/i);
  });
});
