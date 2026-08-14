import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpJiraIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpJiraIntegrationGuideView";
import {
  JIRA_INTEGRATION_HELP_CLAIM_HEADING_ID,
  JIRA_INTEGRATION_HELP_CONNECTION_PRECONDITION,
  JIRA_INTEGRATION_HELP_CONNECTION_PRECONDITION_TAG,
  JIRA_INTEGRATION_HELP_GUIDE_HEADINGS,
  JIRA_INTEGRATION_HELP_INTEGRATION_READINESS_HREF,
  JIRA_INTEGRATION_HELP_PRIMARY_ACTION,
  JIRA_INTEGRATION_HELP_START_HERE_CARD_TITLE,
} from "@/lib/jira-integration-help-guide-content";
import {
  JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  JIRA_INTEGRATION_HELP_SOURCES,
} from "@/lib/jira-integration-help-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpJiraIntegrationGuideView", () => {
  const entry = getProductDocumentationEntry("jira-integration");

  it("renders provenance, start-here card, readingBody, and deduped follow-ups", () => {
    if (entry === undefined) {
      throw new Error("Expected jira-integration documentation entry.");
    }

    render(<HelpJiraIntegrationGuideView entry={entry} />);

    expect(screen.getByTestId("help-jira-integration-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · integrations jira orientation",
    );
    expect(screen.getByTestId("help-jira-integration-connection-precondition")).toHaveTextContent(
      JIRA_INTEGRATION_HELP_CONNECTION_PRECONDITION,
    );
    expect(screen.getByTestId("help-jira-integration-connection-precondition-tag")).toHaveTextContent(
      JIRA_INTEGRATION_HELP_CONNECTION_PRECONDITION_TAG,
    );
    expect(screen.getByTestId("help-jira-integration-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-jira-integration-overview").textContent?.toLowerCase()).not.toContain("ticket");
    expect(screen.getByTestId("help-jira-integration-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-jira-integration-claim-discipline").textContent).toContain(
      JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      JIRA_INTEGRATION_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: JIRA_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      JIRA_INTEGRATION_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: JIRA_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: JIRA_INTEGRATION_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Before you start" })).toBeInTheDocument();
    expect(screen.getByTestId("help-jira-integration-before-you-start")).toBeInTheDocument();

    for (const source of JIRA_INTEGRATION_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.getAllByRole("link", { name: "Integration readiness help" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Integration readiness" })).toHaveAttribute(
      "href",
      JIRA_INTEGRATION_HELP_INTEGRATION_READINESS_HREF,
    );
    expect(screen.getAllByRole("link", { name: "ServiceNow integration" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Jira integration" })).not.toBeInTheDocument();

    for (const heading of JIRA_INTEGRATION_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
