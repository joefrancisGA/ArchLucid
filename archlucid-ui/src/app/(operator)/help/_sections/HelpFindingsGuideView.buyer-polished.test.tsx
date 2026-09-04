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

vi.mock("@/app/(operator)/help/_sections/HelpFindingsWorkspaceReadinessStrip", () => ({
  HelpFindingsWorkspaceReadinessStrip: () => <div data-testid="help-findings-workspace-readiness-mock" />,
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
  usePathname: () => "/help/findings",
}));

import { HelpFindingsGuideView } from "@/app/(operator)/help/_sections/HelpFindingsGuideView";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  FINDINGS_HELP_CLAIM_DISCIPLINE,
  FINDINGS_HELP_FOLLOW_UPS_TITLE,
  FINDINGS_HELP_SOURCES,
} from "@/lib/findings/findings-help-evidence-copy";
import {
  FINDINGS_HELP_FIRST_VIEWPORT_TEST_ID,
  FINDINGS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  FINDINGS_HELP_SKIP_LINK_LABEL,
  FINDINGS_HELP_SKIP_TARGET_ID,
} from "@/lib/findings/findings-help-page-copy";
import {
  FINDINGS_HELP_PRIMARY_ACTIONS,
} from "@/lib/findings/findings-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpFindingsGuideView buyer-polished shell (HFX)", () => {
  const entry = getProductDocumentationEntry("findings");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (entry === undefined) {
      throw new Error("Expected findings documentation entry.");
    }

    render(<HelpFindingsGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: FINDINGS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${FINDINGS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(FINDINGS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      FINDINGS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-findings-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("findings-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-findings-header-actions")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: FINDINGS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-findings-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-findings-primary-content");
    const firstViewport = screen.getByTestId(FINDINGS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-findings-action-panel");
    const orientationBottom = screen.getByTestId("help-findings-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-findings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(firstViewport).toContainElement(screen.getByTestId("help-findings-workspace-readiness-mock"));
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      within(actionPanel).getByRole("link", { name: FINDINGS_HELP_PRIMARY_ACTIONS.openFindings.label }),
    ).toHaveAttribute("href", FINDINGS_HELP_PRIMARY_ACTIONS.openFindings.href);

    for (const source of FINDINGS_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
