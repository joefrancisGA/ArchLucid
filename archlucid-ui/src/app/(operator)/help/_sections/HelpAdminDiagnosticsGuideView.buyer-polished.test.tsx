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
  ADMIN_DIAGNOSTICS_HELP_FIRST_VIEWPORT_TEST_ID,
  ADMIN_DIAGNOSTICS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE_BUYER,
  ADMIN_DIAGNOSTICS_HELP_PRIMARY_CONTENT_ID,
  ADMIN_DIAGNOSTICS_HELP_SKIP_LINK_LABEL,
  ADMIN_DIAGNOSTICS_HELP_SKIP_TARGET_ID,
  ADMIN_DIAGNOSTICS_HELP_START_HERE_CARD_TITLE,
  ADMIN_DIAGNOSTICS_HELP_START_HERE_HELPER,
} from "@/lib/admin-diagnostics-help-page-copy";
import { ADMIN_DIAGNOSTICS_HELP_PAGE_SUBTITLE } from "@/lib/admin-diagnostics-help-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

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
    expect(screen.getByRole("heading", { level: 2, name: ADMIN_DIAGNOSTICS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-admin-diagnostics-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ADMIN_DIAGNOSTICS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ADMIN_DIAGNOSTICS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-admin-diagnostics-action-panel");
    const orientationBottom = screen.getByTestId("help-admin-diagnostics-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-admin-diagnostics-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      screen.getByRole("heading", { level: 2, name: ADMIN_DIAGNOSTICS_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("help-admin-diagnostics-start-here-helper")).toHaveTextContent(
      ADMIN_DIAGNOSTICS_HELP_START_HERE_HELPER,
    );
    expect(
      within(actionPanel).getByRole("link", { name: ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.label }),
    ).toHaveAttribute("href", ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.href);

    for (const source of filterWhereToGoNextFollowUpLinks(ADMIN_DIAGNOSTICS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
