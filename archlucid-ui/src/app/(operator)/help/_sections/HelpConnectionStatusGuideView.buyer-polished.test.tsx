import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("@/app/(operator)/help/_sections/HelpConnectionStatusWorkspaceReadinessStrip", () => ({
  HelpConnectionStatusWorkspaceReadinessStrip: () => (
    <section id="help-connection-status-workspace-readiness" data-testid="help-connection-status-workspace-readiness">
      <h2 id="help-connection-status-workspace-readiness-heading">This workspace</h2>
    </section>
  ),
}));

import { HelpConnectionStatusGuideView } from "@/app/(operator)/help/_sections/HelpConnectionStatusGuideView";
import {
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE,
  CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_HELP_SOURCES,
} from "@/lib/connection-status-help-evidence-copy";
import {
  CONNECTION_STATUS_HELP_PRIMARY_ACTION,
} from "@/lib/connection-status-help-guide-content";
import {
  CONNECTION_STATUS_HELP_FIRST_VIEWPORT_TEST_ID,
  CONNECTION_STATUS_HELP_PRIMARY_CONTENT_ID,
  CONNECTION_STATUS_HELP_SKIP_LINK_LABEL,
  CONNECTION_STATUS_HELP_SKIP_TARGET_ID,
} from "@/lib/connection-status-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpConnectionStatusGuideView buyer-polished shell (HCO)", () => {
  const entry = getProductDocumentationEntry("connection-status");

  it("renders skip link, workspace readiness before follow-ups, header claim discipline, and hides contextual help", () => {
    if (entry === null) {
      throw new Error("Expected connection-status documentation entry.");
    }

    render(<HelpConnectionStatusGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: CONNECTION_STATUS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${CONNECTION_STATUS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-connection-status-header-claim-discipline")).toHaveTextContent(
      CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-connection-status-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-connection-status-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("help-connection-status-action-panel")).toBeNull();

    const primaryContent = screen.getByTestId(CONNECTION_STATUS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(CONNECTION_STATUS_HELP_FIRST_VIEWPORT_TEST_ID);
    const workspaceReadiness = screen.getByTestId("help-connection-status-workspace-readiness");
    const orientationBottom = screen.getByTestId("help-connection-status-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-connection-status-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(workspaceReadiness);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId(CONNECTION_STATUS_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      CONNECTION_STATUS_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: CONNECTION_STATUS_HELP_PRIMARY_ACTION.label })).toHaveLength(1);

    for (const source of filterWhereToGoNextFollowUpLinks(CONNECTION_STATUS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
