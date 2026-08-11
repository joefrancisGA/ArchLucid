import { render, screen, within } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";



vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({

  HelpTopicHashScroll: () => null,

}));



vi.mock("@/components/usability/PageContextualHelpButton", () => ({

  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,

}));



vi.mock("next/navigation", () => ({

  usePathname: () => "/help/data-handling",

}));



import { HelpDataHandlingTenantIsolationGuideView } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationGuideView";

import {

  DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_HELP_CENTER_LABEL,

  DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_SECURITY_TRUST_LABEL,

  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CONTRACTED_PACK_FOLLOW_UP,

  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING,
  DATA_HANDLING_TENANT_ISOLATION_HELP_LEAVES_STAYS_CARDS,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";

import {

  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES,

  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_DISCLOSURE_TITLE,

} from "@/lib/data-handling-tenant-isolation-help-evidence-copy";

import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";

import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";

import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpDataHandlingTenantIsolationGuideView", () => {

  const loaded = tryLoadProductDocumentation("data-handling");



  it("loads tenant-isolation help from the monorepo", () => {

    expect(loaded).not.toBeNull();

    expect(loaded?.entry.title).toBe(DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE);

  });



  it("registers provenance metadata for the data-handling topic", () => {

    const entry = getProductDocumentationEntry("data-handling");



    expect(entry?.lastReviewed).toBe("2026-08-09");

    expect(entry?.releaseApplicability).toContain("V1 GA");

  });



  it("renders compact diligence chrome with cited isolation body (TB-1659)", () => {

    if (loaded === null) {

      throw new Error("Expected data-handling documentation to load.");

    }



    const sourcePath = loaded.entry.sourcePaths[0] ?? "";

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {

      helpTopicSlug: loaded.entry.slug,

    });

    const markdownHeadings = extractHelpMarkdownHeadings(preparedMarkdown);



    render(<HelpDataHandlingTenantIsolationGuideView entry={loaded.entry} markdown={loaded.markdown} />);



    const visible = (document.body.textContent ?? "").toLowerCase();



    expect(preparedMarkdown.toLowerCase()).not.toContain("buyer_security_procurement_packet");

    expect(visible).not.toContain("scripts/");

    expect(visible).toContain("three layers");

    expect(visible).toContain("sql row-level security is not the production isolation boundary");

    expect(screen.getByTestId("help-data-handling-tenant-isolation-guide")).toBeInTheDocument();

    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();

    expect(screen.queryByTestId("help-data-handling-tenant-isolation-residency")).toBeNull();

    expect(screen.queryByTestId("help-data-handling-tenant-isolation-action-panel")).toBeNull();

    expect(screen.queryByTestId("help-data-handling-tenant-isolation-audit-trail-sentence")).toBeNull();

    expect(screen.queryByTestId("help-data-handling-tenant-isolation-orientation")).toBeNull();

    expect(screen.queryByText("Sources for follow-up")).toBeNull();



    expect(

      screen.getByRole("heading", { level: 1, name: DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE }),

    ).toBeInTheDocument();

    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-09");

    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("V1 GA");

    expect(screen.getByTestId("help-topic-download-pdf")).toBeInTheDocument();

    expect(screen.queryByTestId("help-topic-print-pdf")).toBeNull();



    const breadcrumb = screen.getByTestId("help-data-handling-tenant-isolation-breadcrumb");

    expect(within(breadcrumb).getByRole("link", { name: DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_HELP_CENTER_LABEL })).toHaveAttribute(

      "href",

      "/help",

    );

    expect(

      within(breadcrumb).getByRole("link", { name: DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_SECURITY_TRUST_LABEL }),

    ).toHaveAttribute("href", "/help/security-trust");

    expect(within(breadcrumb).getByText(DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE)).toHaveAttribute(

      "aria-current",

      "page",

    );



    const overview = screen.getByTestId("help-data-handling-tenant-isolation-overview");

    expect(overview.textContent?.toLowerCase()).not.toContain("sources links below");

    expect(screen.getByTestId("help-data-handling-tenant-isolation-contracted-pack-follow-up")).toHaveTextContent(

      DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CONTRACTED_PACK_FOLLOW_UP,

    );



    for (const [index, link] of DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS.entries()) {

      expect(

        within(overview).getByTestId(`help-data-handling-tenant-isolation-overview-link-${index}`),

      ).toHaveAttribute("href", link.href);

    }



    const claimDiscipline = screen.getByTestId("help-data-handling-tenant-isolation-claim-discipline");

    expect(claimDiscipline.className).toMatch(/callout|warn|amber|border/i);

    expect(claimDiscipline).toHaveTextContent("not a countersigned DPA");

    const firstViewport = screen.getByTestId("help-data-handling-tenant-isolation-first-viewport");

    for (const card of DATA_HANDLING_TENANT_ISOLATION_HELP_LEAVES_STAYS_CARDS) {
      expect(within(firstViewport).getByTestId(`help-data-handling-tenant-isolation-${card.id}-card`)).toHaveTextContent(
        card.title,
      );
    }

    const related = within(firstViewport).getByTestId("help-data-handling-tenant-isolation-related");

    expect(within(related).getByRole("heading", { name: DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING })).toBeInTheDocument();

    for (const link of DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED) {
      expect(
        within(related).getByTestId(`help-data-handling-tenant-isolation-related-link-${link.label}`),
      ).toHaveAttribute("href", link.href);
    }

    expect(within(related).getByRole("link", { name: "Trust Center" })).toHaveAttribute("href", "/trust");

    expect(within(related).getByRole("link", { name: "Security and trust" })).toHaveAttribute(
      "href",
      "/help/security-trust",
    );

    const headerActions = screen.getByTestId("help-data-handling-tenant-isolation-header-actions");

    expect(

      within(headerActions).getByRole("link", {

        name: DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.label,

      }),

    ).toHaveAttribute("href", DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.href);

    expect(screen.getAllByRole("link", { name: /open trust center/i })).toHaveLength(1);

    const overviewLinks = within(overview).getAllByRole("link");
    expect(overviewLinks.map((anchor) => anchor.getAttribute("href"))).toEqual(["#related-topics"]);

    const firstMarkdownHeading = markdownHeadings.find((heading) => heading.level === 2);

    expect(firstMarkdownHeading).toBeDefined();

    expect(

      screen.getByRole("heading", { level: 2, name: firstMarkdownHeading!.title }),

    ).toBeInTheDocument();

    const toc = screen.getByTestId("help-topic-toc");
    for (const heading of markdownHeadings.filter((candidate) => candidate.level === 2)) {

      expect(toc).toHaveTextContent(heading.title);

    }

    expect(toc).toHaveTextContent(DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING);



    expect(screen.getByTestId("help-data-handling-tenant-isolation-source-disclosure")).toBeInTheDocument();

    expect(screen.getByText(DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_DISCLOSURE_TITLE)).toBeInTheDocument();



    const sourceLinks = screen.getByTestId("help-data-handling-tenant-isolation-source-links");

    for (const link of DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES) {

      const row = within(sourceLinks).getByTestId(`help-data-handling-tenant-isolation-source-row-${link.label}`);

      expect(within(row).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);

      expect(row).toHaveTextContent(link.evidences);

      expect(row).toHaveTextContent(link.access);

    }



    const content = screen.getByTestId("help-data-handling-tenant-isolation-content");
    expect(content).not.toHaveTextContent("Procurement FAQ");
    expect(content).toHaveTextContent("Open the audit trail in your tenant governance workspace.");
    const governanceAuditLinks = within(content)
      .getAllByRole("link")
      .filter(
        (anchor) =>
          anchor.getAttribute("href") === DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openAuditTrail.href,
      );
    expect(governanceAuditLinks.length).toBeGreaterThan(0);

    expect(screen.getAllByRole("link", { name: /security and trust/i }).length).toBeGreaterThan(0);

    expect(screen.queryByRole("link", { name: /^data handling$/i })).toBeNull();

  });

});

