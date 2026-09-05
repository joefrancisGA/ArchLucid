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
  useNavCallerAuthorityRank: () => 1,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      authorityRank: 1,
      primaryAppRole: "Reader",
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 1,
    isAuthorityLoading: false,
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/users-and-roles",
}));

import { HelpUsersAndRolesGuideView } from "@/app/(operator)/help/_sections/HelpUsersAndRolesGuideView";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import {
  USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE,
  USERS_AND_ROLES_HELP_FOLLOW_UPS_TITLE,
  USERS_AND_ROLES_HELP_SOURCES,
} from "@/lib/users-and-roles-help-evidence-copy";
import {
  USERS_AND_ROLES_HELP_ACTION_PANEL_TITLE,
  USERS_AND_ROLES_HELP_FIRST_VIEWPORT_TEST_ID,
  USERS_AND_ROLES_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  USERS_AND_ROLES_HELP_SKIP_LINK_LABEL,
  USERS_AND_ROLES_HELP_SKIP_TARGET_ID,
} from "@/lib/users-and-roles-help-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpUsersAndRolesGuideView buyer-polished shell (HOE)", () => {
  const entry = getProductDocumentationEntry("users-and-roles");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected users-and-roles documentation entry.");
    }

    render(<HelpUsersAndRolesGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: USERS_AND_ROLES_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${USERS_AND_ROLES_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(USERS_AND_ROLES_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("users-and-roles-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("users-and-roles-help-as-of")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-users-and-roles-header-actions")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: USERS_AND_ROLES_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-users-and-roles-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-users-and-roles-primary-content");
    const firstViewport = screen.getByTestId(USERS_AND_ROLES_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-users-and-roles-action-panel");
    const orientationBottom = screen.getByTestId("help-users-and-roles-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-users-and-roles-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      screen.getByRole("heading", { level: 2, name: USERS_AND_ROLES_HELP_ACTION_PANEL_TITLE }),
    ).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(USERS_AND_ROLES_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
