import { render, screen, within } from "@testing-library/react";
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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => null,
}));

vi.mock("@/app/(operator)/help/_sections/HelpConnectionStatusWorkspaceReadinessStrip", () => ({
  HelpConnectionStatusWorkspaceReadinessStrip: () => (
    <section id="help-connection-status-workspace-readiness">
      <h2 id="help-connection-status-workspace-readiness-heading">This workspace</h2>
    </section>
  ),
}));

import { HelpConnectionStatusGuideView } from "@/app/(operator)/help/_sections/HelpConnectionStatusGuideView";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  CONNECTION_STATUS_HELP_CLAIM_HEADING_ID,
  CONNECTION_STATUS_HELP_GUIDE_HEADINGS,
  CONNECTION_STATUS_HELP_PRIMARY_ACTION,
} from "@/lib/connection-status-help-guide-content";
import {
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE,
  CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_HELP_SOURCES,
} from "@/lib/connection-status-help-evidence-copy";
import {
  CONNECTION_STATUS_HELP_FIRST_VIEWPORT_TEST_ID,
  CONNECTION_STATUS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
} from "@/lib/connection-status-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

function renderConnectionStatusGuide(): void {
  const entry = getProductDocumentationEntry("connection-status");

  if (entry === null) {
    throw new Error("Expected connection-status documentation entry.");
  }

  render(<HelpConnectionStatusGuideView entry={entry} />);
}

describe("HelpConnectionStatusGuideView (HCO)", () => {
  it("renders header CTA, status legend, and forbids broken diligence copy", () => {
    renderConnectionStatusGuide();

    expect(screen.getByTestId("help-connection-status-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-connection-status-page-title")).toHaveTextContent("Connection status");
    expect(screen.getByTestId(CONNECTION_STATUS_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      CONNECTION_STATUS_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.queryByTestId("help-connection-status-action-panel")).toBeNull();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-connection-status-status-legend")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-12");
    expect(screen.queryByText(/Sources package/i)).toBeNull();
    expect(screen.getByTestId(CONNECTION_STATUS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("help-connection-status-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: CONNECTION_STATUS_HELP_PRIMARY_ACTION.label })).toBe(
      screen.getByTestId(CONNECTION_STATUS_HELP_PRIMARY_ACTION.testId),
    );
    expect(screen.getByRole("heading", { level: 2, name: CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-connection-status-sources")).toBeInTheDocument();

    const sourcesSection = screen.getByTestId("help-connection-status-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(CONNECTION_STATUS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    const firstViewport = screen.getByTestId(CONNECTION_STATUS_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-connection-status-orientation-bottom");

    expect(
      firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    for (const heading of resolveGuideHeadingsForStrip(
      "help-connection-status",
      CONNECTION_STATUS_HELP_GUIDE_HEADINGS,
      CONNECTION_STATUS_HELP_CLAIM_HEADING_ID,
    )) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
