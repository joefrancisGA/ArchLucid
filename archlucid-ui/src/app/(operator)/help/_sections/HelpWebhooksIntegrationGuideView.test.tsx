import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpWebhooksIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpWebhooksIntegrationGuideView";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  WEBHOOKS_INTEGRATION_HELP_ALERT_RULES_HREF,
  WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID,
  WEBHOOKS_INTEGRATION_HELP_DELIVERY_SECTION_ID,
  WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS,
  WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE,
  WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE,
  WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION,
} from "@/lib/webhooks-integration-help-guide-content";
import {
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  WEBHOOKS_INTEGRATION_HELP_SOURCES,
} from "@/lib/webhooks-integration-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  WEBHOOKS_DELIVERY_CONTRACT_HEADING,
  WEBHOOKS_PAGE_DESCRIPTION,
  WEBHOOKS_SIGNATURE_ALGORITHM,
  WEBHOOKS_SIGNATURE_HEADER_NAME,
  WEBHOOKS_SIGNATURE_KEY_SCOPE_NOTE,
  WEBHOOKS_SIGNATURE_VERIFICATION,
  WEBHOOKS_TEST_FAILURE,
} from "@/lib/webhooks-page-copy";

describe("HelpWebhooksIntegrationGuideView", () => {
  const entry = getProductDocumentationEntry("webhooks-integration");

  it("renders provenance, peer header actions, delivery contract, TOC sections, and stacked sources", () => {
    if (entry === undefined) {
      throw new Error("Expected webhooks-integration documentation entry.");
    }

    render(<HelpWebhooksIntegrationGuideView entry={entry} />);

    expect(screen.getByTestId("help-webhooks-integration-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-13");
    expect(screen.getByTestId("help-webhooks-integration-page-title")).toHaveTextContent("Webhooks");
    expect(WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE).not.toBe(WEBHOOKS_PAGE_DESCRIPTION);
    expect(screen.getByTestId("help-webhooks-integration-mutation-prerequisite")).toHaveTextContent(
      WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE,
    );
    expect(screen.getByTestId("help-webhooks-integration-header-actions").className).toContain("items-center");
    expect(screen.getByTestId("help-webhooks-integration-header-actions").className).not.toContain("flex-col");
    expect(screen.getByTestId("help-webhooks-integration-role-tag")).toBeInTheDocument();
    expect(screen.queryByTestId("help-webhooks-integration-action-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-webhooks-integration-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-webhooks-integration-claim-discipline").textContent).toContain(
      WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE.startsWith("This guide explains")).toBe(false);
    expect(screen.getByRole("heading", { name: WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getAllByRole("link", { name: WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.getByTestId("help-webhooks-integration-primary-cta")).toHaveAttribute(
      "href",
      WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.href,
    );

    expect(screen.getByTestId("help-webhooks-integration-delivery-section")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: WEBHOOKS_DELIVERY_CONTRACT_HEADING })).toHaveAttribute(
      "id",
      WEBHOOKS_INTEGRATION_HELP_DELIVERY_SECTION_ID,
    );
    expect(screen.getByTestId("help-webhooks-integration-delivery-section")).toHaveTextContent(
      WEBHOOKS_SIGNATURE_VERIFICATION,
    );
    expect(screen.getByTestId("help-webhooks-integration-delivery-section")).toHaveTextContent(
      WEBHOOKS_SIGNATURE_KEY_SCOPE_NOTE,
    );
    const signatureContract = screen.getByTestId("help-webhooks-integration-signature-contract");
    expect(signatureContract).toHaveTextContent(WEBHOOKS_SIGNATURE_HEADER_NAME);
    expect(signatureContract).toHaveTextContent(WEBHOOKS_SIGNATURE_ALGORITHM);
    expect(screen.queryByTestId("help-webhooks-integration-signature-technical-details")).not.toBeInTheDocument();

    expect(screen.getByTestId("help-webhooks-integration-how-stepper")).toHaveTextContent(WEBHOOKS_TEST_FAILURE);
    expect(screen.queryByRole("link", { name: "Open alert rules →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open integration readiness →" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: formatHelpFollowUpLinkAccessibleName(WEBHOOKS_INTEGRATION_HELP_ALERT_RULES_HREF, "Alert rules") })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Webhooks" })).not.toBeInTheDocument();

    const destinationHrefs = new Set<string>();
    destinationHrefs.add(WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.href);

    for (const source of WEBHOOKS_INTEGRATION_HELP_SOURCES) {
      const sourcesRegion = within(screen.getByTestId("help-webhooks-integration-sources"));
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);

      expect(sourcesRegion.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
      expect(sourcesRegion.getByText(source.when)).toBeInTheDocument();
      expect(destinationHrefs.has(source.href)).toBe(false);
      destinationHrefs.add(source.href);
    }

    const alertRulesFollowUp = within(screen.getByTestId("help-webhooks-integration-sources")).getByRole("link", {
      name: formatHelpFollowUpLinkAccessibleName(WEBHOOKS_INTEGRATION_HELP_ALERT_RULES_HREF, "Alert rules"),
    });
    expect(alertRulesFollowUp.className).toContain("border-neutral-300");

    for (const heading of WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
