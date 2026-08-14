import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpWebhooksIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpWebhooksIntegrationGuideView";
import {
  WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID,
  WEBHOOKS_INTEGRATION_HELP_DELIVERY_SECTION_ID,
  WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS,
  WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE,
  WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE,
  WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION,
  WEBHOOKS_INTEGRATION_HELP_READINESS_HREF,
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

  it("renders provenance, header action, delivery contract, TOC sections, and stacked sources", () => {
    if (entry === undefined) {
      throw new Error("Expected webhooks-integration documentation entry.");
    }

    render(<HelpWebhooksIntegrationGuideView entry={entry} />);

    expect(screen.getByTestId("help-webhooks-integration-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · integrations webhooks orientation",
    );
    expect(screen.getByTestId("help-webhooks-integration-page-title")).toHaveTextContent("Webhooks");
    expect(WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE).not.toBe(WEBHOOKS_PAGE_DESCRIPTION);
    expect(screen.getByTestId("help-webhooks-integration-mutation-prerequisite")).toHaveTextContent(
      WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE,
    );
    expect(screen.queryByTestId("help-webhooks-integration-action-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-webhooks-integration-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-webhooks-integration-claim-discipline").textContent).toContain(
      WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getAllByRole("link", { name: WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.getByRole("link", { name: WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
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
    expect(screen.getByTestId("help-webhooks-integration-signature-technical-details")).toHaveTextContent(
      WEBHOOKS_SIGNATURE_HEADER_NAME,
    );
    expect(screen.getByTestId("help-webhooks-integration-signature-technical-details")).toHaveTextContent(
      WEBHOOKS_SIGNATURE_ALGORITHM,
    );

    expect(screen.getByTestId("help-webhooks-integration-how-stepper")).toHaveTextContent(WEBHOOKS_TEST_FAILURE);
    expect(screen.getByTestId("help-webhooks-integration-readiness-link")).toHaveAttribute(
      "href",
      WEBHOOKS_INTEGRATION_HELP_READINESS_HREF,
    );
    expect(screen.getAllByRole("link", { name: "Alert rules" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Webhooks" })).not.toBeInTheDocument();

    for (const source of WEBHOOKS_INTEGRATION_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
      expect(screen.getByText(source.when)).toBeInTheDocument();
    }

    for (const heading of WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
