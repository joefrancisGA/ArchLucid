import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpServiceNowIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpServiceNowIntegrationGuideView";
import {
  expectClaimDisciplineBandContent,
  expectClaimDisciplineHeading,
} from "@/lib/claim-discipline-test-helpers";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID,
  SERVICENOW_INTEGRATION_HELP_CONNECTION_PRECONDITION,
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
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpServiceNowIntegrationGuideView", () => {
  const entry = getProductDocumentationEntry("servicenow-integration");

  it("renders provenance, breadcrumb, start-here card, readingBody, TOC, and deduped follow-ups", () => {
    if (entry === undefined) {
      throw new Error("Expected servicenow-integration documentation entry.");
    }

    render(<HelpServiceNowIntegrationGuideView entry={entry} />);

    expect(screen.getByTestId("help-servicenow-integration-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-13");
    expect(screen.getByTestId("help-topic-registry-provenance")).not.toHaveTextContent(
      "integrations servicenow orientation",
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
    expect(screen.queryByTestId("help-servicenow-integration-connection-precondition-tag")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-servicenow-integration-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-servicenow-integration-claim-discipline-strip")).toHaveTextContent(
      SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-servicenow-integration",
      "help-servicenow-integration-claim-discipline",
      SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expectClaimDisciplineHeading(
      screen,
      "help-servicenow-integration",
      SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
      SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.label })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: SERVICENOW_INTEGRATION_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Before you connect" })).toBeInTheDocument();
    expect(screen.getByTestId("help-servicenow-integration-before-you-connect")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Integration readiness" })).not.toBeInTheDocument();

    for (const source of SERVICENOW_INTEGRATION_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);

      expect(screen.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(screen.getByRole("link", { name: "Read Integration readiness help" })).toHaveAttribute(
      "href",
      SERVICENOW_INTEGRATION_HELP_INTEGRATION_READINESS_HREF,
    );
    expect(screen.getAllByRole("link", { name: "Read Integration readiness help" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Open Jira integration" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open Jira integration" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "ServiceNow integration" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Read integration readiness help →/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Open Jira integration →/)).not.toBeInTheDocument();

    for (const heading of resolveGuideHeadingsForStrip(
      "help-servicenow-integration",
      SERVICENOW_INTEGRATION_HELP_GUIDE_HEADINGS,
      SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID,
    )) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
