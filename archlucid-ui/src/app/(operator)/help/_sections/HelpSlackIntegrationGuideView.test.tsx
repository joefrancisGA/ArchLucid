import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/app/(operator)/help/_sections/HelpSlackIntegrationWorkspaceReadinessStrip", () => ({
  HelpSlackIntegrationWorkspaceReadinessStrip: (props: { readonly showSetupPrecondition?: boolean }) => (
    <div
      data-show-setup-precondition={props.showSetupPrecondition === true ? "true" : "false"}
      data-testid="help-slack-integration-workspace-readiness"
    >
      <div data-testid="help-slack-integration-workspace-readiness-status">Not configured</div>
    </div>
  ),
}));

import { HelpSlackIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpSlackIntegrationGuideView";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  SLACK_INTEGRATION_HELP_CLAIM_HEADING_ID,
  SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_BODY,
  SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_TITLE,
  SLACK_INTEGRATION_HELP_GUIDE_HEADINGS,
  SLACK_INTEGRATION_HELP_PRIMARY_ACTION,
  SLACK_INTEGRATION_HELP_START_HERE_CARD_TITLE,
} from "@/lib/slack-integration-help-guide-content";
import {
  SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  SLACK_INTEGRATION_HELP_SOURCES,
} from "@/lib/slack-integration-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSlackIntegrationGuideView", () => {
  const entry = getProductDocumentationEntry("slack-integration");

  it("renders provenance, header action, readiness strip, credential disclosure, TOC, and prefixed follow-ups", () => {
    if (entry === undefined) {
      throw new Error("Expected slack-integration documentation entry.");
    }

    render(<HelpSlackIntegrationGuideView entry={entry} />);

    expect(screen.getByTestId("help-slack-integration-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-13");
    expect(screen.getByTestId("help-topic-registry-provenance")).not.toHaveTextContent(
      "integrations slack notifications orientation",
    );
    expect(screen.getByTestId("help-slack-integration-workspace-readiness")).toBeInTheDocument();
    expect(screen.getByTestId("help-slack-integration-workspace-readiness-status")).toBeInTheDocument();
    expect(screen.getByTestId("help-slack-integration-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-slack-integration-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-slack-integration-claim-discipline").textContent?.toLowerCase()).toContain(
      "does not",
    );
    expect(screen.getByTestId("help-slack-integration-claim-discipline").textContent).toContain(
      SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      SLACK_INTEGRATION_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getAllByRole("link", { name: SLACK_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.getByRole("link", { name: SLACK_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      SLACK_INTEGRATION_HELP_PRIMARY_ACTION.href,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: SLACK_INTEGRATION_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Set up Slack notifications" })).toBeInTheDocument();
    expect(screen.getByTestId("help-slack-integration-setup-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("help-slack-integration-credential-handling-details")).toHaveTextContent(
      SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_TITLE,
    );
    expect(screen.getByTestId("help-slack-integration-credential-handling-details")).toHaveTextContent(
      SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_BODY,
    );

    for (const source of SLACK_INTEGRATION_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);

      expect(screen.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
      expect(screen.getByText(source.when)).toBeInTheDocument();
    }

    expect(screen.getByRole("link", { name: "Open Alert rules" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read How alerts work" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read Security and trust help" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Slack notifications" })).not.toBeInTheDocument();

    for (const heading of SLACK_INTEGRATION_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
