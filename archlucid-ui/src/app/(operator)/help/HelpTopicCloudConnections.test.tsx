import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpCloudConnectionsGuideView } from "@/app/(operator)/help/_sections/HelpCloudConnectionsGuideView";
import {
  CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS,
  CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE,
  CLOUD_CONNECTIONS_HELP_PACKAGING_SCRIPTS_HINT,
  CLOUD_CONNECTIONS_HELP_PATH,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
  CLOUD_CONNECTIONS_HELP_PROVIDER_SCOPE_ROWS,
  CLOUD_CONNECTIONS_HELP_TIER_1,
  CLOUD_CONNECTIONS_HELP_TIER_2,
} from "@/lib/cloud-connections-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpCloudConnectionsGuideView (HCE)", () => {
  it("renders breadcrumb, provenance, header actions, orientation callout, and where-to-go-next panel", () => {
    const entry = getProductDocumentationEntry("cloud-connections");

    expect(entry?.slug).toBe("cloud-connections");
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.pdfStatus).toBe("customer");
    expect(entry?.sectionAnchors).toEqual(["choose-your-cloud-platform", "related-topics"]);

    if (entry === null) {
      throw new Error("Expected cloud-connections documentation entry.");
    }

    render(
      <HelpCloudConnectionsGuideView
        entry={entry}
        markdown="# Cloud connections\n\nOptional connectors for read-only evidence.\n\n## Related topics\n\n- [Security and trust](/help/security-trust)\n"
      />,
    );

    expect(screen.getByTestId("help-cloud-connections-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-cloud-connections-page-title").closest("[data-nav-href]")).toHaveAttribute(
      "data-nav-href",
      CLOUD_CONNECTIONS_HELP_PATH,
    );
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByTestId("help-cloud-connections-breadcrumb")).toHaveTextContent("Help");
    expect(screen.getByTestId("help-cloud-connections-breadcrumb")).toHaveTextContent("Cloud connections");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-09");
    expect(screen.getByTestId("help-topic-download-pdf")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.queryByTestId("help-cloud-connections-sources")).toBeNull();
    expect(screen.getByTestId("help-cloud-connections-claim-discipline")).toHaveAttribute(
      "aria-labelledby",
      "help-cloud-connections-orientation-heading",
    );
    expect(screen.getByRole("heading", { level: 3, name: CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Orientation only" })).toBeNull();
    expect(screen.getByTestId("help-cloud-connections-claim-discipline-status")).toHaveTextContent("Orientation");
    const callout = screen.getByTestId("help-cloud-connections-claim-discipline");

    expect(within(callout).getByRole("link", { name: "Assurance status" })).toHaveAttribute("href", "/security-trust");
    expect(within(callout).getByRole("link", { name: "Cloud connections hub" })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
    expect(screen.getByTestId("help-cloud-connections-intro")).toBeInTheDocument();
    expect(screen.getByTestId("help-cloud-connections-action-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where to go next" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Connect Azure securely" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Read the Azure connection guide" })).toBeNull();
    expect(screen.queryByTestId("help-center-documentation-badge")).toBeNull();
  });

  it("defines evidence tiers and provider scope before deep setup content", () => {
    const entry = getProductDocumentationEntry("cloud-connections");

    if (entry === null) {
      throw new Error("Expected cloud-connections documentation entry.");
    }

    render(
      <HelpCloudConnectionsGuideView
        entry={entry}
        markdown="# Cloud connections\n\nOptional connectors for read-only evidence.\n"
      />,
    );

    const providerScope = screen.getByTestId("help-cloud-connections-provider-scope");
    const actionPanel = screen.getByTestId("help-cloud-connections-action-panel");
    const intro = screen.getByTestId("help-cloud-connections-intro");
    const relatedContent = screen.getByTestId("help-cloud-connections-content");

    expect(intro.compareDocumentPosition(providerScope) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(providerScope.compareDocumentPosition(actionPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(actionPanel.compareDocumentPosition(relatedContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(providerScope).getByText(CLOUD_CONNECTIONS_HELP_TIER_1.title)).toBeInTheDocument();
    expect(within(providerScope).getByText(CLOUD_CONNECTIONS_HELP_TIER_2.title)).toBeInTheDocument();
    expect(within(providerScope).getByText(CLOUD_CONNECTIONS_HELP_TIER_1.statusLabel)).toBeInTheDocument();
    expect(within(providerScope).getByText(CLOUD_CONNECTIONS_HELP_TIER_2.statusLabel)).toBeInTheDocument();
    expect(
      within(providerScope).getAllByRole("link", {
        name: CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.startEvidenceOnlyReview.label,
      }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(providerScope).getAllByRole("link", {
        name: CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.startEvidenceOnlyReview.label,
      })[0],
    ).toHaveAttribute("href", "/architecture/reviews/new");
    expect(within(providerScope).getByText(CLOUD_CONNECTIONS_HELP_PACKAGING_SCRIPTS_HINT, { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "CLI usage" })).toBeNull();
    expect(screen.getByTestId("help-cloud-connections-provider-scope-table")).toHaveAttribute(
      "aria-label",
      "Scrollable Choose your cloud platform table 1",
    );
    expect(screen.getByTestId("help-cloud-connections-provider-scope-table")).toHaveAttribute("tabindex", "0");

    for (const row of CLOUD_CONNECTIONS_HELP_PROVIDER_SCOPE_ROWS) {
      expect(within(providerScope).getByRole("link", { name: row.guideLabel })).toHaveAttribute("href", row.guideHref);
    }
  });

  it("does not self-link follow-up destinations to the cloud-connections help route", () => {
    const entry = getProductDocumentationEntry("cloud-connections");

    if (entry === null) {
      throw new Error("Expected cloud-connections documentation entry.");
    }

    render(
      <HelpCloudConnectionsGuideView
        entry={entry}
        markdown="# Cloud connections\n\nOptional connectors for read-only evidence.\n"
      />,
    );

    const hrefs = CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS.map((link) => link.href);
    const uniqueHrefs = new Set(hrefs);

    expect(uniqueHrefs.size).toBe(hrefs.length);

    for (const link of CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS) {
      const matches = screen.getAllByRole("link", { name: link.label });

      expect(matches.some((anchor) => anchor.getAttribute("href") === link.href)).toBe(true);
      expect(link.href).not.toBe(CLOUD_CONNECTIONS_HELP_PATH);
    }

    expect(
      screen.getByRole("link", { name: "How ArchLucid works" }),
    ).toHaveAttribute("href", "/help/getting-started#how-archlucid-works");
  });
});
