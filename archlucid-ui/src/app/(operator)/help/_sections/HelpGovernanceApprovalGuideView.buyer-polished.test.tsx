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

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
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
  usePathname: () => "/help/governance-approval",
}));

import { HelpGovernanceApprovalGuideView } from "@/app/(operator)/help/_sections/HelpGovernanceApprovalGuideView";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import {
  GOVERNANCE_APPROVAL_HELP_ACTION_CARD_TITLE,
  GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS,
} from "@/lib/governance/governance-approval-help-guide-content";
import {
  GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE,
  GOVERNANCE_APPROVAL_HELP_SOURCES,
} from "@/lib/governance/governance-approval-help-evidence-copy";
import {
  GOVERNANCE_APPROVAL_HELP_FIRST_VIEWPORT_TEST_ID,
  GOVERNANCE_APPROVAL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  GOVERNANCE_APPROVAL_HELP_SKIP_LINK_LABEL,
  GOVERNANCE_APPROVAL_HELP_SKIP_TARGET_ID,
} from "@/lib/governance/governance-approval-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpGovernanceApprovalGuideView buyer-polished shell (GO)", () => {
  const entry = getProductDocumentationEntry("governance-approval");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    render(<HelpGovernanceApprovalGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: GOVERNANCE_APPROVAL_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_APPROVAL_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(GOVERNANCE_APPROVAL_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-governance-approval-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-governance-approval-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-governance-approval-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-governance-approval-technical-reference")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-approval-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-governance-approval-primary-content");
    const firstViewport = screen.getByTestId(GOVERNANCE_APPROVAL_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-governance-approval-action-panel");
    const orientationBottom = screen.getByTestId("help-governance-approval-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-governance-approval-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      within(actionPanel).getByRole("link", { name: GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openWorkflow.label }),
    ).toHaveAttribute("href", GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openWorkflow.href);
    expect(
      screen.getByRole("heading", { level: 2, name: GOVERNANCE_APPROVAL_HELP_ACTION_CARD_TITLE }),
    ).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(GOVERNANCE_APPROVAL_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
