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
  DATA_HANDLING_TENANT_ISOLATION_HELP_ACTION_PANEL_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_HELP_CENTER_LABEL,
  DATA_HANDLING_TENANT_ISOLATION_HELP_BREADCRUMB_SECURITY_TRUST_LABEL,
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
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

  it("renders specialty diligence chrome with three-layer isolation (TB-1659)", () => {
    if (loaded === null) {
      throw new Error("Expected data-handling documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: loaded.entry.slug,
    });

    render(<HelpDataHandlingTenantIsolationGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("buyer_security_procurement_packet");
    expect(visible).not.toContain("scripts/");
    expect(visible).toContain("three layers");
    expect(visible).toContain("sql row-level security is not the production isolation boundary");
    expect(screen.getByTestId("help-data-handling-tenant-isolation-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-data-handling-tenant-isolation-residency")).toBeInTheDocument();

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

    for (const [index, link] of DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS.entries()) {
      expect(
        within(overview).getByTestId(`help-data-handling-tenant-isolation-overview-link-${index}`),
      ).toHaveAttribute("href", link.href);
    }

    const claimDiscipline = screen.getByTestId("help-data-handling-tenant-isolation-claim-discipline");
    expect(claimDiscipline.className).toMatch(/callout|warn|amber|border/i);
    expect(claimDiscipline).toHaveTextContent("not a countersigned DPA");

    const actionPanel = screen.getByTestId("help-data-handling-tenant-isolation-action-panel");
    expect(actionPanel.className).not.toMatch(/bg-teal/);
    expect(actionPanel.className).toMatch(/w-full/);
    expect(screen.queryByRole("heading", { name: DATA_HANDLING_TENANT_ISOLATION_HELP_ACTION_PANEL_TITLE })).toBeNull();
    expect(screen.getByText(DATA_HANDLING_TENANT_ISOLATION_HELP_ACTION_PANEL_TITLE)).toBeInTheDocument();
    expect(
      within(actionPanel).getByRole("link", {
        name: DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.label,
      }),
    ).toHaveAttribute("href", DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.href);
    expect(
      within(actionPanel).getByRole("link", {
        name: DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.securityTrust.label,
      }),
    ).toHaveAttribute("href", DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.securityTrust.href);
    expect(
      within(actionPanel).queryByRole("link", {
        name: DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openAuditTrail.label,
      }),
    ).toBeNull();

    const auditSentence = screen.getByTestId("help-data-handling-tenant-isolation-audit-trail-sentence");
    expect(auditSentence).toHaveTextContent("Open the audit trail in your tenant governance workspace.");
    expect(screen.getByTestId("help-data-handling-tenant-isolation-audit-trail-link")).toHaveAttribute(
      "href",
      DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openAuditTrail.href,
    );

    const sources = screen.getByTestId("help-data-handling-tenant-isolation-sources");
    expect(sources).toHaveTextContent("Sources for follow-up");
    for (const link of DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      screen.getByRole("heading", { level: 2, name: DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toHaveTextContent(
      DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY_HEADING,
    );

    expect(screen.getAllByRole("link", { name: /security and trust/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /^data handling$/i })).toBeNull();
  });
});
