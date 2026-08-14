import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTeamsIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpTeamsIntegrationGuideView";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  TEAMS_INTEGRATION_HELP_CLAIM_HEADING_ID,
  TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS,
  TEAMS_INTEGRATION_HELP_PRIMARY_ACTION,
  TEAMS_INTEGRATION_HELP_START_HERE_CARD_TITLE,
  TEAMS_INTEGRATION_HELP_WEBHOOK_PRECONDITION,
} from "@/lib/teams-integration-help-guide-content";
import {
  TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  TEAMS_INTEGRATION_HELP_SOURCES,
} from "@/lib/teams-integration-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpTeamsIntegrationGuideView", () => {
  const entry = getProductDocumentationEntry("teams-integration");

  it("renders provenance, start-here card, readingBody, and deduped follow-ups", () => {
    if (entry === undefined) {
      throw new Error("Expected teams-integration documentation entry.");
    }

    render(<HelpTeamsIntegrationGuideView entry={entry} />);

    expect(screen.getByTestId("help-teams-integration-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-13");
    expect(screen.getByTestId("help-teams-integration-webhook-precondition")).toHaveTextContent(
      TEAMS_INTEGRATION_HELP_WEBHOOK_PRECONDITION,
    );
    expect(screen.queryByTestId("help-teams-integration-webhook-precondition-tag")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-teams-integration-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-teams-integration-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-teams-integration-claim-discipline").textContent).toContain(
      TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      TEAMS_INTEGRATION_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: TEAMS_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      TEAMS_INTEGRATION_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: TEAMS_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: TEAMS_INTEGRATION_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Set up Teams notifications" })).toBeInTheDocument();
    expect(screen.getByTestId("help-teams-integration-setup-stepper")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open alert rules →" })).not.toBeInTheDocument();

    for (const source of TEAMS_INTEGRATION_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);

      expect(screen.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(screen.getAllByRole("link", { name: "Open Alert rules" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Microsoft Teams notifications" })).not.toBeInTheDocument();

    for (const heading of TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
