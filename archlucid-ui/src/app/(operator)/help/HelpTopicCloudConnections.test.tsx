import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpCloudConnectionsGuideView } from "@/app/(operator)/help/_sections/HelpCloudConnectionsGuideView";
import {
  CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS,
  CLOUD_CONNECTIONS_HELP_PATH,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
  CLOUD_CONNECTIONS_HELP_PROVIDER_SCOPE_ROWS,
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
    expect(screen.getByTestId("help-cloud-connections-breadcrumb")).toHaveTextContent("Help");
    expect(screen.getByTestId("help-cloud-connections-breadcrumb")).toHaveTextContent("Cloud connections");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-09");
    expect(screen.getByTestId("help-topic-download-pdf")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.queryByTestId("help-cloud-connections-sources")).toBeNull();
    expect(screen.getByTestId("help-cloud-connections-claim-discipline")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Orientation only" })).toBeNull();
    expect(screen.getByTestId("help-cloud-connections-claim-discipline-status")).toHaveTextContent("Orientation");
    expect(screen.getByTestId("help-cloud-connections-action-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where to go next" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Continue setup" })).toBeNull();
    expect(screen.getByRole("link", { name: CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.label })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
    expect(screen.queryByRole("button", { name: "Connect Azure securely" })).toBeNull();
    expect(screen.getByRole("link", { name: "Read the Azure connection guide" })).toHaveAttribute(
      "href",
      "/help/cloud-connections/azure",
    );
    expect(screen.getAllByTestId("help-center-documentation-badge").length).toBeGreaterThan(0);
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

    const content = screen.getByTestId("help-cloud-connections-content");
    const providerScope = screen.getByTestId("help-cloud-connections-provider-scope");

    expect(within(content).getByRole("heading", { name: "Choose your cloud platform" })).toBeInTheDocument();
    expect(within(providerScope).getByText(/Tier 1 \(default\)/i)).toBeInTheDocument();
    expect(within(providerScope).getByText(/Tier 2 \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByTestId("help-cloud-connections-provider-scope-table")).toBeInTheDocument();

    for (const row of CLOUD_CONNECTIONS_HELP_PROVIDER_SCOPE_ROWS) {
      expect(within(content).getByRole("link", { name: row.guideLabel })).toHaveAttribute("href", row.guideHref);
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

    for (const link of CLOUD_CONNECTIONS_HELP_FOLLOW_UP_LINKS) {
      const matches = screen.getAllByRole("link", { name: link.label });

      expect(matches.some((anchor) => anchor.getAttribute("href") === link.href)).toBe(true);
      expect(link.href).not.toBe(CLOUD_CONNECTIONS_HELP_PATH);
    }
  });
});
