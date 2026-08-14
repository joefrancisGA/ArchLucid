import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpSlackIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpSlackIntegrationGuideView";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import {
  SLACK_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE,
  SLACK_INTEGRATION_HELP_CLAIM_HEADING_ID,
  SLACK_INTEGRATION_HELP_GUIDE_HEADINGS,
  SLACK_INTEGRATION_HELP_PRIMARY_ACTION,
  SLACK_INTEGRATION_HELP_START_HERE_CARD_TITLE,
  SLACK_INTEGRATION_HELP_WEBHOOK_PRECONDITION,
  SLACK_INTEGRATION_HELP_WEBHOOK_PRECONDITION_TAG,
} from "@/lib/slack-integration-help-guide-content";
import {
  SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  SLACK_INTEGRATION_HELP_SOURCES,
} from "@/lib/slack-integration-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSlackIntegrationGuideView", () => {
  const entry = getProductDocumentationEntry("slack-integration");

  it("renders breadcrumb, provenance, start-here card, readingBody, TOC sections, and stacked sources", () => {
    if (entry === undefined) {
      throw new Error("Expected slack-integration documentation entry.");
    }

    render(<HelpSlackIntegrationGuideView entry={entry} />);

    expect(screen.getByTestId("help-slack-integration-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent(
      HELP_TOPIC_BREADCRUMB_HUB_LABEL,
    );
    expect(screen.getByRole("link", { name: HELP_TOPIC_BREADCRUMB_HUB_LABEL })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · integrations slack notifications orientation",
    );
    expect(screen.getByTestId("help-slack-integration-webhook-precondition")).toHaveTextContent(
      SLACK_INTEGRATION_HELP_WEBHOOK_PRECONDITION,
    );
    expect(screen.getByTestId("help-slack-integration-webhook-precondition-tag")).toHaveTextContent(
      SLACK_INTEGRATION_HELP_WEBHOOK_PRECONDITION_TAG,
    );
    expect(screen.getByTestId("help-slack-integration-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-slack-integration-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-slack-integration-claim-discipline").textContent).toContain(
      SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      SLACK_INTEGRATION_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: SLACK_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      SLACK_INTEGRATION_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: SLACK_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: SLACK_INTEGRATION_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(
      SLACK_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Set up Slack notifications" })).toBeInTheDocument();
    expect(screen.getByTestId("help-slack-integration-setup-stepper")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open alert rules" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open alert rules →" })).not.toBeInTheDocument();

    for (const source of SLACK_INTEGRATION_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.getAllByRole("link", { name: "Alert rules" })).toHaveLength(1);
    const integrationReadinessSource = SLACK_INTEGRATION_HELP_SOURCES.find(
      (source) => source.label === "Integration readiness",
    );
    expect(integrationReadinessSource).toBeDefined();
    expect(screen.getByRole("link", { name: "Integration readiness" })).toHaveAttribute(
      "href",
      integrationReadinessSource?.href,
    );
    expect(screen.queryByRole("link", { name: "Slack notifications" })).not.toBeInTheDocument();

    for (const heading of SLACK_INTEGRATION_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
