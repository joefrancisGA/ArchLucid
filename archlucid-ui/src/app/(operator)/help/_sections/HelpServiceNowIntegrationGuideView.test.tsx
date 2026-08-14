import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpServiceNowIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpServiceNowIntegrationGuideView";
import {
  SERVICENOW_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE,
  SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID,
  SERVICENOW_INTEGRATION_HELP_CONNECTION_PRECONDITION,
  SERVICENOW_INTEGRATION_HELP_CONNECTION_PRECONDITION_TAG,
  SERVICENOW_INTEGRATION_HELP_GUIDE_HEADINGS,
  SERVICENOW_INTEGRATION_HELP_INTEGRATION_READINESS_HREF,
  SERVICENOW_INTEGRATION_HELP_PAGE_TITLE,
  SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION,
  SERVICENOW_INTEGRATION_HELP_START_HERE_CARD_TITLE,
} from "@/lib/servicenow-integration-help-guide-content";
import {
  SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  SERVICENOW_INTEGRATION_HELP_SOURCES,
} from "@/lib/servicenow-integration-help-evidence-copy";
import { SERVICENOW_INTEGRATION_PAGE_TITLE } from "@/lib/servicenow-integration-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpServiceNowIntegrationGuideView", () => {
  const entry = getProductDocumentationEntry("servicenow-integration");

  it("renders breadcrumb, provenance, start-here card, readingBody, TOC, and deduped follow-ups", () => {
    if (entry === undefined) {
      throw new Error("Expected servicenow-integration documentation entry.");
    }

    render(<HelpServiceNowIntegrationGuideView entry={entry} />);

    expect(screen.getByTestId("help-servicenow-integration-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent(
      HELP_TOPIC_BREADCRUMB_HUB_LABEL,
    );
    expect(screen.getByRole("link", { name: HELP_TOPIC_BREADCRUMB_HUB_LABEL })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · integrations servicenow orientation",
    );
    expect(screen.getByTestId("help-servicenow-integration-page-title")).toHaveTextContent(
      SERVICENOW_INTEGRATION_HELP_PAGE_TITLE,
    );
    expect(screen.getByTestId("help-servicenow-integration-page-title").textContent).not.toBe(
      SERVICENOW_INTEGRATION_PAGE_TITLE,
    );
    expect(screen.getByTestId("help-servicenow-integration-connection-precondition")).toHaveTextContent(
      SERVICENOW_INTEGRATION_HELP_CONNECTION_PRECONDITION,
    );
    expect(screen.getByTestId("help-servicenow-integration-connection-precondition-tag")).toHaveTextContent(
      SERVICENOW_INTEGRATION_HELP_CONNECTION_PRECONDITION_TAG,
    );
    expect(screen.getByTestId("help-servicenow-integration-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-servicenow-integration-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-servicenow-integration-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "not a",
    );
    expect(screen.getByTestId("help-servicenow-integration-claim-discipline").textContent).toContain(
      SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: SERVICENOW_INTEGRATION_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(
      SERVICENOW_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Before you connect" })).toBeInTheDocument();
    expect(screen.getByTestId("help-servicenow-integration-before-you-connect")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.label })).toBeNull();

    for (const source of SERVICENOW_INTEGRATION_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.getAllByRole("link", { name: "Integration readiness help" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Integration readiness" })).toHaveAttribute(
      "href",
      SERVICENOW_INTEGRATION_HELP_INTEGRATION_READINESS_HREF,
    );
    expect(screen.getAllByRole("link", { name: "Jira integration" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "ServiceNow integration" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Read integration readiness help →/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Open Jira integration →/)).not.toBeInTheDocument();

    for (const heading of SERVICENOW_INTEGRATION_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
