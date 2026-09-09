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

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => false,
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 100,
  }),
}));

import { HelpAdminDiagnosticsGuideView } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsGuideView";
import {
  ADMIN_DIAGNOSTICS_HELP_CLAIM_DISCIPLINE,
  ADMIN_DIAGNOSTICS_HELP_FOLLOW_UPS_TITLE,
  ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION,
  ADMIN_DIAGNOSTICS_HELP_SOURCES,
} from "@/lib/admin-diagnostics-help-evidence-copy";
import {
  ADMIN_DIAGNOSTICS_HELP_BUYER_OVERVIEW,
  ADMIN_DIAGNOSTICS_HELP_FIRST_VIEWPORT_TEST_ID,
  ADMIN_DIAGNOSTICS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ADMIN_DIAGNOSTICS_HELP_ORIENTATION_BOTTOM_TEST_ID,
  ADMIN_DIAGNOSTICS_HELP_PAGE_LEAD,
  ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE_BUYER,
  ADMIN_DIAGNOSTICS_HELP_PRIMARY_CONTENT_ID,
  ADMIN_DIAGNOSTICS_HELP_SKIP_LINK_LABEL,
  ADMIN_DIAGNOSTICS_HELP_SKIP_TARGET_ID,
  ADMIN_DIAGNOSTICS_HELP_START_HERE_CARD_TITLE,
  ADMIN_DIAGNOSTICS_HELP_START_HERE_HELPER,
  ADMIN_DIAGNOSTICS_HELP_WORKSPACE_TEST_ID,
} from "@/lib/admin-diagnostics-help-page-copy";
import { ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE } from "@/lib/admin-diagnostics-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

describe("HelpAdminDiagnosticsGuideView buyer-polished shell (HAE)", () => {
  const entry = getProductDocumentationEntry("admin-diagnostics");
  const loaded = tryLoadProductDocumentation("admin-diagnostics");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected admin-diagnostics documentation to load.");
    }

    render(<HelpAdminDiagnosticsGuideView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: ADMIN_DIAGNOSTICS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ADMIN_DIAGNOSTICS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(ADMIN_DIAGNOSTICS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      ADMIN_DIAGNOSTICS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-admin-diagnostics-page-orientation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-admin-diagnostics-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-admin-diagnostics-live-surfaces")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-admin-diagnostics-intro")).toHaveTextContent(ADMIN_DIAGNOSTICS_HELP_PAGE_LEAD);
    expect(screen.getByRole("heading", { level: 2, name: ADMIN_DIAGNOSTICS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-admin-diagnostics-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ADMIN_DIAGNOSTICS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ADMIN_DIAGNOSTICS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-admin-diagnostics-action-panel");
    const overview = screen.getByTestId("help-admin-diagnostics-overview");
    const signalTable = screen.getByTestId("help-admin-diagnostics-signal-table");
    const orientationBottom = screen.getByTestId(ADMIN_DIAGNOSTICS_HELP_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("help-admin-diagnostics-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(screen.getByTestId("help-admin-diagnostics-intro"));
    expect(firstViewport).toContainElement(actionPanel);
    expect(
      firstViewport,
    ).not.toContainElement(screen.getByTestId("help-admin-diagnostics-overview"));
    expect(primaryContent).toContainElement(overview);
    const workspace = screen.getByTestId(ADMIN_DIAGNOSTICS_HELP_WORKSPACE_TEST_ID);
    expect(primaryContent).toContainElement(workspace);
    expect(workspace).toContainElement(signalTable);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-admin-diagnostics-overview")).toHaveTextContent(
      ADMIN_DIAGNOSTICS_HELP_BUYER_OVERVIEW,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: ADMIN_DIAGNOSTICS_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("help-admin-diagnostics-start-here-helper")).toHaveTextContent(
      ADMIN_DIAGNOSTICS_HELP_START_HERE_HELPER,
    );
    expect(
      within(actionPanel).getByRole("link", { name: ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.label }),
    ).toHaveAttribute("href", ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.href);

    expectWhereToGoNextFollowUpLinks(within(sourcesSection), ADMIN_DIAGNOSTICS_HELP_SOURCES, "/");

    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspace.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
