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

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/slack-integration",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { HelpSlackIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpSlackIntegrationGuideView";
import {
  SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_HELP_SOURCES,
} from "@/lib/slack-integration-help-evidence-copy";
import {
  SLACK_INTEGRATION_HELP_BUYER_START_HERE_HELPER,
  SLACK_INTEGRATION_HELP_PAGE_SUBTITLE,
  SLACK_INTEGRATION_HELP_PRIMARY_ACTION,
  SLACK_INTEGRATION_HELP_START_HERE_CARD_TITLE,
} from "@/lib/slack-integration-help-guide-content";
import {
  SLACK_INTEGRATION_HELP_BUYER_OVERVIEW,
  SLACK_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID,
  SLACK_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SLACK_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID,
  SLACK_INTEGRATION_HELP_PAGE_LEAD,
  SLACK_INTEGRATION_HELP_PAGE_SUBTITLE_BUYER,
  SLACK_INTEGRATION_HELP_PRIMARY_CONTENT_ID,
  SLACK_INTEGRATION_HELP_SKIP_LINK_LABEL,
  SLACK_INTEGRATION_HELP_SKIP_TARGET_ID,
  SLACK_INTEGRATION_HELP_WORKSPACE_TEST_ID,
} from "@/lib/slack-integration-help-page-copy";
import { formatHelpTopicApplicabilityMetadata } from "@/lib/help/help-topic-applicability-metadata";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

describe("HelpSlackIntegrationGuideView buyer-polished shell (HSL)", () => {
  const entry = getProductDocumentationEntry("slack-integration");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected slack-integration documentation entry.");
    }

    render(<HelpSlackIntegrationGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: SLACK_INTEGRATION_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SLACK_INTEGRATION_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(SLACK_INTEGRATION_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(SLACK_INTEGRATION_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(SLACK_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-slack-integration-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-slack-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-slack-integration-buyer-provenance")).toHaveTextContent(
      formatHelpTopicApplicabilityMetadata(entry)!,
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-slack-integration-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc-mobile")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-slack-integration-sources")).toBeInTheDocument();
    expect(screen.getByTestId("help-slack-integration-intro")).toHaveTextContent(SLACK_INTEGRATION_HELP_PAGE_LEAD);
    expect(screen.getByTestId("help-slack-integration-overview")).toHaveTextContent(
      SLACK_INTEGRATION_HELP_BUYER_OVERVIEW,
    );

    const primaryContent = screen.getByTestId(SLACK_INTEGRATION_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(SLACK_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-slack-integration-action-panel");
    const overview = screen.getByTestId("help-slack-integration-overview");
    const workspace = screen.getByTestId(SLACK_INTEGRATION_HELP_WORKSPACE_TEST_ID);
    const featureItems = screen.getByTestId("help-slack-integration-feature-items");
    const orientationBottom = screen.getByTestId(SLACK_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("help-slack-integration-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(firstViewport).toContainElement(screen.getByTestId("help-slack-integration-intro"));
    expect(firstViewport).not.toContainElement(overview);
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(workspace);
    expect(workspace).toContainElement(featureItems);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-slack-integration-workspace-readiness")).toBeInTheDocument();
    expect(screen.getByTestId("help-slack-integration-buyer-start-here-helper")).toHaveTextContent(
      SLACK_INTEGRATION_HELP_BUYER_START_HERE_HELPER,
    );
    expect(
      within(actionPanel).queryByRole("link", { name: SLACK_INTEGRATION_HELP_PRIMARY_ACTION.label }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: SLACK_INTEGRATION_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();

    expectWhereToGoNextFollowUpLinks(within(sourcesSection), SLACK_INTEGRATION_HELP_SOURCES, "/help/slack-integration");

    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspace.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
