import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpCloudConnectionsGuideView } from "@/app/(operator)/help/_sections/HelpCloudConnectionsGuideView";
import {
  CLOUD_CONNECTIONS_HELP_ACTION_PANEL_INTRO,
  CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS,
  CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE,
  CLOUD_CONNECTIONS_HELP_PACKAGING_SCRIPTS_HINT,
  CLOUD_CONNECTIONS_HELP_PATH,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
  CLOUD_CONNECTIONS_HELP_PROVIDER_SCOPE_ROWS,
  CLOUD_CONNECTIONS_HELP_TIER_1,
  CLOUD_CONNECTIONS_HELP_TIER_2,
} from "@/lib/cloud-connections-help-guide-content";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help/help-diligence-artifact-index";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

function renderCloudConnectionsGuide(markdown = "# Cloud connections\n\nOptional connectors for read-only evidence.\n"): void {
  const entry = getProductDocumentationEntry("cloud-connections");

  if (entry === null) {
    throw new Error("Expected cloud-connections documentation entry.");
  }

  render(<HelpCloudConnectionsGuideView entry={entry} markdown={markdown} />);
}

describe("HelpCloudConnectionsGuideView (HCE)", () => {
  it("renders provenance, header actions, orientation callout, and where-to-go-next panel", () => {
    const entry = getProductDocumentationEntry("cloud-connections");

    expect(entry?.slug).toBe("cloud-connections");
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.pdfStatus).toBe("customer");
    expect(entry?.sectionAnchors).toEqual(["choose-your-cloud-platform", "related-topics"]);

    renderCloudConnectionsGuide(
      "# Cloud connections\n\nOptional connectors for read-only evidence.\n\n## Related topics\n\n- [Security and trust](/help/security-trust)\n",
    );

    expect(screen.getByTestId("help-cloud-connections-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-cloud-connections-page-title").closest("[data-nav-href]")).toHaveAttribute(
      "data-nav-href",
      CLOUD_CONNECTIONS_HELP_PATH,
    );
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-download-pdf")).toBeNull();
    expect(screen.queryByTestId("help-cloud-connections-sources")).toBeNull();
    expect(screen.getByTestId("help-cloud-connections-orientation")).toHaveAttribute(
      "aria-labelledby",
      "help-cloud-connections-orientation-heading",
    );
    expect(screen.getByRole("heading", { level: 3, name: CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Orientation only" })).toBeNull();
    expect(screen.queryByTestId("help-cloud-connections-claim-discipline-status")).toBeNull();
    expect(screen.getByTestId("help-cloud-connections-intro")).toBeInTheDocument();
    expect(screen.getByTestId("help-cloud-connections-action-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where to go next" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Connect Azure securely" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Read the Azure connection guide" })).toBeNull();
    expect(screen.queryByTestId("help-center-documentation-badge")).toBeNull();
    expect(screen.getByText(HELP_DILIGENCE_ARTIFACT_INDEX_TITLE, { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(/Sources package/i)).toBeNull();
    expect(screen.queryByText(/claim discipline/i)).toBeNull();
    expect(screen.queryByText(/assurance cites/i)).toBeNull();

    const orientation = screen.getByTestId("help-cloud-connections-orientation");

    expect(within(orientation).getByRole("link", { name: "Assurance status" })).toHaveAttribute(
      "href",
      "/assurance-status",
    );
    expect(within(orientation).getByRole("link", { name: "Cloud connections hub" })).toHaveAttribute(
      "href",
      CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.href,
    );
  });

  it("defines evidence tiers and provider scope before deep setup content", () => {
    renderCloudConnectionsGuide();

    const providerScope = screen.getByTestId("help-cloud-connections-provider-scope");
    const actionPanel = screen.getByTestId("help-cloud-connections-action-panel");
    const intro = screen.getByTestId("help-cloud-connections-intro");
    const relatedContent = screen.getByTestId("help-cloud-connections-content");

    expect(intro.compareDocumentPosition(providerScope) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(providerScope.compareDocumentPosition(actionPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(actionPanel.compareDocumentPosition(relatedContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(providerScope).getByText(CLOUD_CONNECTIONS_HELP_TIER_1.title)).toBeInTheDocument();
    expect(within(providerScope).getByText(CLOUD_CONNECTIONS_HELP_TIER_2.title)).toBeInTheDocument();
    expect(within(providerScope).getByText(CLOUD_CONNECTIONS_HELP_TIER_1.eyebrow)).toBeInTheDocument();
    expect(within(providerScope).getByText(CLOUD_CONNECTIONS_HELP_TIER_2.eyebrow)).toBeInTheDocument();
    expect(within(providerScope).getByTestId("help-cloud-connections-tier-1-card")).toHaveClass("border-l-teal-700");
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
    expect(within(providerScope).getByText(CLOUD_CONNECTIONS_HELP_TIER_2.useWhen, { exact: false })).toHaveTextContent(
      "on the primary federated path",
    );
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

  it("keeps exactly one primary CTA on the page", () => {
    renderCloudConnectionsGuide();

    expect(screen.getAllByTestId("help-cloud-connections-primary-cta")).toHaveLength(1);
    expect(screen.getByTestId("help-cloud-connections-primary-cta")).toHaveTextContent(
      CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.startEvidenceOnlyReview.label,
    );
  });

  it("matches where-to-go-next intro capabilities with follow-up links", () => {
    renderCloudConnectionsGuide();

    const actionPanel = screen.getByTestId("help-cloud-connections-action-panel");

    expect(within(actionPanel).getByText(CLOUD_CONNECTIONS_HELP_ACTION_PANEL_INTRO)).toBeInTheDocument();
    expect(within(actionPanel).queryByRole("button")).toBeNull();

    for (const link of CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS) {
      const matches = within(actionPanel).getAllByRole("link", { name: link.label });

      expect(matches.some((anchor) => anchor.getAttribute("href") === link.href)).toBe(true);
    }
  });

  it("renders a sticky TOC with four on-page sections", () => {
    renderCloudConnectionsGuide(
      "# Cloud connections\n\nOptional connectors for read-only evidence.\n\n## Related topics\n\n- [Security and trust](/help/security-trust)\n",
    );

    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "Choose your cloud platform" })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "Where to go next" })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "Related topics" })).not.toHaveLength(0);
  });

  it("does not self-link follow-up destinations to the cloud-connections help route", () => {
    renderCloudConnectionsGuide();

    const hrefs = CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS.map((link) => link.href);
    const uniqueHrefs = new Set(hrefs);

    expect(uniqueHrefs.size).toBe(hrefs.length);

    for (const link of CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS) {
      const matches = screen.getAllByRole("link", { name: link.label });

      expect(matches.some((anchor) => anchor.getAttribute("href") === link.href)).toBe(true);
      expect(link.href).not.toBe(CLOUD_CONNECTIONS_HELP_PATH);
    }
  });

  it("does not render editorial StatusTag labels on this route", () => {
    renderCloudConnectionsGuide();

    expect(screen.queryByText("Orientation")).toBeNull();
    expect(screen.queryByText("Default")).toBeNull();
    expect(screen.getByText(CLOUD_CONNECTIONS_HELP_TIER_2.eyebrow)).toBeInTheDocument();
  });
});
