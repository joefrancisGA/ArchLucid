import { render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";



vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({

  HelpTopicHashScroll: () => null,

}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});



import { HelpTeamsIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpTeamsIntegrationGuideView";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  expectClaimDisciplineBandContent,
  expectClaimDisciplineHeading,
} from "@/lib/claim-discipline-test-helpers";

import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

import {

  TEAMS_INTEGRATION_HELP_CLAIM_HEADING_ID,

  TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS,

  TEAMS_INTEGRATION_HELP_PAGE_EYEBROW,

  TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE,

  TEAMS_INTEGRATION_HELP_PRIMARY_ACTION,

  TEAMS_INTEGRATION_HELP_SECURITY_CALLOUT_BODY,

  TEAMS_INTEGRATION_HELP_SECURITY_SECTION_TITLE,

  TEAMS_INTEGRATION_HELP_START_HERE_CARD_TITLE,

  TEAMS_INTEGRATION_HELP_WEBHOOK_PRECONDITION,

} from "@/lib/teams-integration-help-guide-content";

import {

  TEAMS_INTEGRATION_HELP_ALTERNATIVE_SOURCES,

  TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE,

  TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,

  TEAMS_INTEGRATION_HELP_SOURCES,

} from "@/lib/teams-integration-help-evidence-copy";

import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

import { TEAMS_INTEGRATION_PAGE_SUBTITLE } from "@/lib/teams-integration-page-copy";



describe("HelpTeamsIntegrationGuideView", () => {

  const entry = getProductDocumentationEntry("teams-integration");



  it("renders provenance, start-here card, readingBody, and deduped follow-ups", () => {

    if (entry === undefined) {

      throw new Error("Expected teams-integration documentation entry.");

    }



    render(<HelpTeamsIntegrationGuideView entry={entry} />);



    expect(screen.getByTestId("help-teams-integration-guide")).toBeInTheDocument();

    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();

    expect(screen.getByTestId("page-heading-eyebrow")).toHaveTextContent(TEAMS_INTEGRATION_HELP_PAGE_EYEBROW);

    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-13");

    expect(screen.getByTestId("help-teams-integration-webhook-precondition")).toHaveTextContent(

      TEAMS_INTEGRATION_HELP_WEBHOOK_PRECONDITION,

    );

    expect(screen.getByTestId("help-teams-integration-webhook-precondition")).not.toHaveTextContent("Incoming webhook.");

    expect(screen.queryByTestId("help-teams-integration-webhook-precondition-tag")).not.toBeInTheDocument();

    expect(screen.getByTestId("help-teams-integration-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);

    expect(screen.getByTestId("help-teams-integration-claim-discipline-strip")).toHaveTextContent(
      TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
    );

    expectClaimDisciplineBandContent(
      screen,
      "help-teams-integration",
      "help-teams-integration-claim-discipline",
      TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    expectClaimDisciplineHeading(
      screen,
      "help-teams-integration",
      TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
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

    expect(screen.getByRole("heading", { level: 2, name: TEAMS_INTEGRATION_HELP_SECURITY_SECTION_TITLE })).toBeInTheDocument();

    expect(screen.getByTestId("help-teams-integration-security-callout")).toHaveTextContent(

      TEAMS_INTEGRATION_HELP_SECURITY_CALLOUT_BODY,

    );

    expect(screen.getByTestId("help-teams-integration-how-stepper").tagName).toBe("UL");

    expect(screen.getByTestId("help-teams-integration-how-stepper").textContent).not.toMatch(/Integration readiness/i);

    expect(screen.getByText(TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE)).toBeInTheDocument();

    expect(TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE).not.toBe(TEAMS_INTEGRATION_PAGE_SUBTITLE);

    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 2, name: "Set up Teams notifications" })).toBeInTheDocument();

    expect(screen.getByTestId("help-teams-integration-setup-stepper")).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Open alert rules →" })).not.toBeInTheDocument();



    for (const source of TEAMS_INTEGRATION_HELP_SOURCES) {

      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);



      expect(screen.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);

    }



    for (const source of TEAMS_INTEGRATION_HELP_ALTERNATIVE_SOURCES) {

      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);



      expect(screen.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);

    }



    expect(screen.getAllByRole("link", { name: "Open Alert rules" })).toHaveLength(1);

    expect(screen.queryByRole("link", { name: "Microsoft Teams notifications" })).not.toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Open Slack" })).not.toBeInTheDocument();

    expect(screen.queryByRole("link", { name: "Open Webhooks" })).not.toBeInTheDocument();



    for (const heading of resolveGuideHeadingsForStrip(
      "help-teams-integration",
      TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS,
      TEAMS_INTEGRATION_HELP_CLAIM_HEADING_ID,
    )) {

      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();

    }

  });

});

